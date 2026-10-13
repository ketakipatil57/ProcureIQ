import sys
import types
import unittest
from io import BytesIO
from unittest.mock import patch

from fastapi.testclient import TestClient

similarity_stub = types.ModuleType("app.similarity")
similarity_stub.find_similar_standards = lambda _text: []
with patch.dict(sys.modules, {"app.similarity": similarity_stub}):
    from app.main import app


def make_pdf(content: bytes) -> bytes:
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        f"<< /Length {len(content)} >>\nstream\n".encode() + content + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for object_number, body in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{object_number} 0 obj\n".encode() + body + b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n".encode()
    )
    return bytes(pdf)


class PdfExtractionEndpointTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, raise_server_exceptions=False)

    def test_extracts_text_from_valid_text_pdf(self):
        pdf_bytes = make_pdf(b"BT /F1 12 Tf 40 250 Td (ProcureIQ tender text) Tj ET")

        with self.assertLogs("uvicorn.error", level="INFO") as captured:
            response = self.client.post(
                "/extract-pdf",
                files={"file": ("tender.pdf", BytesIO(pdf_bytes), "application/pdf")},
            )

        self.assertEqual(response.status_code, 200)
        self.assertIn("ProcureIQ tender text", response.json()["text"])
        self.assertIn(f"byte_count={len(pdf_bytes)}", captured.output[0])
        self.assertIn("outcome=success", captured.output[0])
        self.assertNotIn("ProcureIQ tender text", captured.output[0])

    def test_empty_pdf_upload_fails_instead_of_reporting_success(self):
        with self.assertLogs("uvicorn.error", level="ERROR") as captured:
            response = self.client.post(
                "/extract-pdf",
                files={"file": ("empty.pdf", b"", "application/pdf")},
            )

        self.assertEqual(response.status_code, 500)
        self.assertIn("filename=empty.pdf byte_count=0 outcome=failed", captured.output[0])
        self.assertIn("exception_type=EmptyFileError", captured.output[0])
        self.assertIn("exception_message=Cannot read an empty file", captured.output[0])

    def test_corrupt_pdf_upload_fails_instead_of_reporting_success(self):
        with self.assertLogs("uvicorn.error", level="ERROR") as captured:
            response = self.client.post(
                "/extract-pdf",
                files={"file": ("corrupt.pdf", b"not a PDF", "application/pdf")},
            )

        self.assertEqual(response.status_code, 500)
        self.assertIn("exception_type=PdfStreamError", captured.output[0])

    def test_image_only_pdf_returns_empty_text_without_fabricating_content(self):
        pdf_bytes = make_pdf(
            b"q 100 0 0 100 0 0 cm BI /W 1 /H 1 /CS /RGB /BPC 8 /F /AHx "
            b"ID 000000> EI Q"
        )

        with self.assertLogs("uvicorn.error", level="INFO") as captured:
            response = self.client.post(
                "/extract-pdf",
                files={"file": ("scanned.pdf", BytesIO(pdf_bytes), "application/pdf")},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["text"], "")
        self.assertIn("outcome=empty", captured.output[0])


if __name__ == "__main__":
    unittest.main()
