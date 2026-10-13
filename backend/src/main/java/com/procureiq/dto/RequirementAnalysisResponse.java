package com.procureiq.dto;

import java.util.ArrayList;
import java.util.List;

public class RequirementAnalysisResponse {

    private AnalysisStatus status;
    private String originalRequirement;
    private String interpretedRequirement;
    private String interpretationDisclosureKey = "requirement.confirmation_is_not_verification";
    private String category;
    private String productFamilyId;
    private String userProvidedStandardReference;
    private String standardReferenceVerificationStatus;
    private String standardReferenceApplicabilityStatus;
    private List<Reason> reasons = new ArrayList<>();
    private List<IdentifiedSpecification> identifiedSpecifications = new ArrayList<>();
    private List<MaterialAttribute> materialMissingAttributes = new ArrayList<>();
    private List<ClarificationQuestion> clarificationQuestions = new ArrayList<>();
    private List<ProvidedAnswer> providedAnswers = new ArrayList<>();

    public AnalysisStatus getStatus() { return status; }
    public void setStatus(AnalysisStatus status) { this.status = status; }
    public String getOriginalRequirement() { return originalRequirement; }
    public void setOriginalRequirement(String originalRequirement) { this.originalRequirement = originalRequirement; }
    public String getInterpretedRequirement() { return interpretedRequirement; }
    public void setInterpretedRequirement(String interpretedRequirement) { this.interpretedRequirement = interpretedRequirement; }
    public String getInterpretationDisclosureKey() { return interpretationDisclosureKey; }
    public void setInterpretationDisclosureKey(String interpretationDisclosureKey) { this.interpretationDisclosureKey = interpretationDisclosureKey; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getProductFamilyId() { return productFamilyId; }
    public void setProductFamilyId(String productFamilyId) { this.productFamilyId = productFamilyId; }
    public String getUserProvidedStandardReference() { return userProvidedStandardReference; }
    public void setUserProvidedStandardReference(String userProvidedStandardReference) { this.userProvidedStandardReference = userProvidedStandardReference; }
    public String getStandardReferenceVerificationStatus() { return standardReferenceVerificationStatus; }
    public void setStandardReferenceVerificationStatus(String standardReferenceVerificationStatus) { this.standardReferenceVerificationStatus = standardReferenceVerificationStatus; }
    public String getStandardReferenceApplicabilityStatus() { return standardReferenceApplicabilityStatus; }
    public void setStandardReferenceApplicabilityStatus(String standardReferenceApplicabilityStatus) { this.standardReferenceApplicabilityStatus = standardReferenceApplicabilityStatus; }
    public List<Reason> getReasons() { return reasons; }
    public void setReasons(List<Reason> reasons) { this.reasons = reasons; }
    public List<IdentifiedSpecification> getIdentifiedSpecifications() { return identifiedSpecifications; }
    public void setIdentifiedSpecifications(List<IdentifiedSpecification> identifiedSpecifications) {
        this.identifiedSpecifications = identifiedSpecifications;
    }
    public List<MaterialAttribute> getMaterialMissingAttributes() { return materialMissingAttributes; }
    public void setMaterialMissingAttributes(List<MaterialAttribute> materialMissingAttributes) { this.materialMissingAttributes = materialMissingAttributes; }
    public List<ClarificationQuestion> getClarificationQuestions() { return clarificationQuestions; }
    public void setClarificationQuestions(List<ClarificationQuestion> clarificationQuestions) { this.clarificationQuestions = clarificationQuestions; }
    public List<ProvidedAnswer> getProvidedAnswers() { return providedAnswers; }
    public void setProvidedAnswers(List<ProvidedAnswer> providedAnswers) { this.providedAnswers = providedAnswers; }

    public enum AnalysisStatus {
        CLEAR,
        AMBIGUOUS,
        UNSUPPORTED,
        UNCERTAIN
    }

    public enum InformationStatus {
        KNOWN,
        UNKNOWN,
        UNANSWERED,
        UNRESOLVED
    }

    public static class Reason {
        private String code;
        private String explanationKey;
        private String explanation;

        public Reason() {
        }

        public Reason(String code, String explanationKey, String explanation) {
            this.code = code;
            this.explanationKey = explanationKey;
            this.explanation = explanation;
        }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getExplanationKey() { return explanationKey; }
        public void setExplanationKey(String explanationKey) { this.explanationKey = explanationKey; }
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
    }

    public static class MaterialAttribute {
        private String attributeId;
        private String labelKey;
        private boolean material;
        private InformationStatus informationStatus;

        public MaterialAttribute() {
        }

        public MaterialAttribute(String attributeId, String labelKey, InformationStatus informationStatus) {
            this.attributeId = attributeId;
            this.labelKey = labelKey;
            this.material = true;
            this.informationStatus = informationStatus;
        }

        public String getAttributeId() { return attributeId; }
        public void setAttributeId(String attributeId) { this.attributeId = attributeId; }
        public String getLabelKey() { return labelKey; }
        public void setLabelKey(String labelKey) { this.labelKey = labelKey; }
        public boolean isMaterial() { return material; }
        public void setMaterial(boolean material) { this.material = material; }
        public InformationStatus getInformationStatus() { return informationStatus; }
        public void setInformationStatus(InformationStatus informationStatus) { this.informationStatus = informationStatus; }
    }

    public static class IdentifiedSpecification {
        private String attributeId;
        private String labelKey;
        private String value;

        public IdentifiedSpecification() {
        }

        public IdentifiedSpecification(String attributeId, String labelKey, String value) {
            this.attributeId = attributeId;
            this.labelKey = labelKey;
            this.value = value;
        }

        public String getAttributeId() { return attributeId; }
        public void setAttributeId(String attributeId) { this.attributeId = attributeId; }
        public String getLabelKey() { return labelKey; }
        public void setLabelKey(String labelKey) { this.labelKey = labelKey; }
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }

    public static class ClarificationQuestion {
        private String id;
        private String attributeId;
        private String promptKey;
        private boolean material = true;
        private List<Option> options = new ArrayList<>();

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getAttributeId() { return attributeId; }
        public void setAttributeId(String attributeId) { this.attributeId = attributeId; }
        public String getPromptKey() { return promptKey; }
        public void setPromptKey(String promptKey) { this.promptKey = promptKey; }
        public boolean isMaterial() { return material; }
        public void setMaterial(boolean material) { this.material = material; }
        public List<Option> getOptions() { return options; }
        public void setOptions(List<Option> options) { this.options = options; }
    }

    public static class Option {
        private String id;
        private String labelKey;
        private InformationStatus informationStatus;
        private boolean otherTextAllowed;

        public Option() {
        }

        public Option(String id, String labelKey, InformationStatus informationStatus) {
            this(id, labelKey, informationStatus, "other".equals(id) || "other_medium".equals(id));
        }

        public Option(String id, String labelKey, InformationStatus informationStatus, boolean otherTextAllowed) {
            this.id = id;
            this.labelKey = labelKey;
            this.informationStatus = informationStatus;
            this.otherTextAllowed = otherTextAllowed;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getLabelKey() { return labelKey; }
        public void setLabelKey(String labelKey) { this.labelKey = labelKey; }
        public InformationStatus getInformationStatus() { return informationStatus; }
        public void setInformationStatus(InformationStatus informationStatus) { this.informationStatus = informationStatus; }
        public boolean isOtherTextAllowed() { return otherTextAllowed; }
        public void setOtherTextAllowed(boolean otherTextAllowed) { this.otherTextAllowed = otherTextAllowed; }
    }

    public static class ProvidedAnswer {
        private String questionId;
        private String optionId;
        private InformationStatus informationStatus;
        private String otherText;
        private String interpretedValue;

        public ProvidedAnswer() {
        }

        public ProvidedAnswer(String questionId, String optionId, InformationStatus informationStatus, String otherText) {
            this.questionId = questionId;
            this.optionId = optionId;
            this.informationStatus = informationStatus;
            this.otherText = otherText;
        }

        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }
        public String getOptionId() { return optionId; }
        public void setOptionId(String optionId) { this.optionId = optionId; }
        public InformationStatus getInformationStatus() { return informationStatus; }
        public void setInformationStatus(InformationStatus informationStatus) { this.informationStatus = informationStatus; }
        public String getOtherText() { return otherText; }
        public void setOtherText(String otherText) { this.otherText = otherText; }
        public String getInterpretedValue() { return interpretedValue; }
        public void setInterpretedValue(String interpretedValue) { this.interpretedValue = interpretedValue; }
    }
}
