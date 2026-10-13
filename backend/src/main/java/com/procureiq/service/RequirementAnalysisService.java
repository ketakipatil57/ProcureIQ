package com.procureiq.service;

import com.procureiq.dto.RequirementAnalysisRequest;
import com.procureiq.dto.RequirementAnalysisRequest.Answer;
import com.procureiq.dto.RequirementAnalysisResponse;
import com.procureiq.dto.RequirementAnalysisResponse.AnalysisStatus;
import com.procureiq.dto.RequirementAnalysisResponse.ClarificationQuestion;
import com.procureiq.dto.RequirementAnalysisResponse.InformationStatus;
import com.procureiq.dto.RequirementAnalysisResponse.IdentifiedSpecification;
import com.procureiq.dto.RequirementAnalysisResponse.MaterialAttribute;
import com.procureiq.dto.RequirementAnalysisResponse.Option;
import com.procureiq.dto.RequirementAnalysisResponse.ProvidedAnswer;
import com.procureiq.dto.RequirementAnalysisResponse.Reason;
import com.procureiq.repository.StandardRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class RequirementAnalysisService {

    private static final List<QuestionDefinition> QUESTIONS = List.of(
            question("cement.type", "cement.type", "requirement.question.cement_type",
                    "requirement.attribute.cement_type", "CEMENT",
                    option("ordinary_portland", "requirement.option.ordinary_portland"),
                    option("pozzolana", "requirement.option.pozzolana"),
                    option("slag", "requirement.option.slag_cement"),
                    otherOption(),
                    unknownOption()),
            question("cement.grade", "cement.grade", "requirement.question.cement_grade",
                    "requirement.attribute.cement_grade", "CEMENT",
                    option("grade_33", "requirement.option.grade_33"),
                    option("grade_43", "requirement.option.grade_43"),
                    option("grade_53", "requirement.option.grade_53"),
                    otherOption(),
                    unknownOption()),
            supplementalQuestion("cement.application", "cement.application",
                    "requirement.question.cement_application", "requirement.attribute.cement_application",
                    "CEMENT",
                    option("general_construction", "requirement.option.general_construction"),
                    option("concrete_infrastructure", "requirement.option.concrete_infrastructure"),
                    otherOption(),
                    unknownOption()),
            question("electrical_cable.design", "electrical_cable.design",
                    "requirement.question.electrical_cable_design",
                    "requirement.attribute.electrical_cable_design", "ELECTRICAL_CABLE",
                    option("pvc_general", "requirement.option.pvc_general_cable"),
                    option("pvc_heavy_duty", "requirement.option.pvc_heavy_duty_cable"),
                    option("xlpe", "requirement.option.xlpe_cable"),
                    option("flexible_appliance", "requirement.option.flexible_appliance_cable"),
                    otherOption(),
                    unknownOption()),
            question("electrical_cable.voltage", "electrical_cable.voltage",
                    "requirement.question.electrical_cable_voltage",
                    "requirement.attribute.electrical_cable_voltage", "ELECTRICAL_CABLE",
                    option("up_to_1100v", "requirement.option.up_to_1100v"),
                    option("above_1100v", "requirement.option.above_1100v"),
                    otherOption(),
                    unknownOption()),
            supplementalQuestion("electrical_cable.conductor", "electrical_cable.conductor",
                    "requirement.question.electrical_cable_conductor",
                    "requirement.attribute.electrical_cable_conductor", "ELECTRICAL_CABLE",
                    option("rigid", "requirement.option.rigid_conductor"),
                    option("flexible", "requirement.option.flexible_conductor"),
                    otherOption(),
                    unknownOption()),
            question("helmet.use", "helmet.use", "requirement.question.helmet_use",
                    "requirement.attribute.helmet_use", "HELMET",
                    option("industrial", "requirement.option.industrial_helmet"),
                    option("two_wheeler", "requirement.option.two_wheeler_helmet"),
                    otherOption(),
                    unknownOption()),
            question("gas_valve.service", "gas_valve.service", "requirement.question.gas_valve_service",
                    "requirement.attribute.gas_valve_service", "GAS_VALVE",
                    option("lpg", "requirement.option.lpg"),
                    option("compressed_gas", "requirement.option.compressed_gas"),
                    otherOption(),
                    unknownOption()),
            question("fire_extinguisher.medium", "fire_extinguisher.medium",
                    "requirement.question.fire_extinguisher_medium",
                    "requirement.attribute.fire_extinguisher_medium", "FIRE_EXTINGUISHER",
                    option("dry_powder", "requirement.option.dry_powder"),
                    otherOption("other_medium"),
                    unknownOption()),
            supplementalQuestion("fire_extinguisher.form", "fire_extinguisher.form",
                    "requirement.question.fire_extinguisher_form",
                    "requirement.attribute.fire_extinguisher_form", "FIRE_EXTINGUISHER",
                    option("portable", "requirement.option.portable_extinguisher"),
                    option("mobile", "requirement.option.mobile_extinguisher"),
                    otherOption(),
                    unknownOption()),
            question("food_contact_plastic.material", "food_contact_plastic.material",
                    "requirement.question.food_contact_plastic_material",
                    "requirement.attribute.food_contact_plastic_material", "FOOD_CONTACT_PLASTIC",
                    option("polyethylene", "requirement.option.polyethylene"),
                    option("polypropylene", "requirement.option.polypropylene"),
                    option("pvc", "requirement.option.pvc"),
                    option("polystyrene", "requirement.option.polystyrene"),
                    option("pet_pbt", "requirement.option.pet_pbt"),
                    otherOption(),
                    unknownOption()),
            question("food_contact_plastic.contact_use", "food_contact_plastic.contact_use",
                    "requirement.question.food_contact_plastic_contact_use",
                    "requirement.attribute.food_contact_plastic_contact_use", "FOOD_CONTACT_PLASTIC",
                    option("foodstuffs", "requirement.option.foodstuffs"),
                    option("pharmaceuticals", "requirement.option.pharmaceuticals"),
                    option("drinking_water", "requirement.option.drinking_water"),
                    otherOption(),
                    unknownOption()),
            supplementalQuestion("food_contact_plastic.product_form", "food_contact_plastic.product_form",
                    "requirement.question.food_contact_plastic_product_form",
                    "requirement.attribute.food_contact_plastic_product_form", "FOOD_CONTACT_PLASTIC",
                    option("packaging", "requirement.option.food_packaging"),
                    option("feeding_bottle", "requirement.option.feeding_bottle"),
                    otherOption(),
                    unknownOption()),
            supplementalQuestion("reference.is_number", "reference.is_number", "requirement.question.standard_reference",
                    "requirement.attribute.standard_reference", "REFERENCE",
                    referenceOption(),
                    unknownOption())
    );
    private final StandardRepository standardRepository;

    public RequirementAnalysisService(StandardRepository standardRepository) {
        this.standardRepository = standardRepository;
    }

    private static final Pattern UNSUPPORTED_SERVICE = Pattern.compile(
            "(?iu)\\b(software|consultancy|consulting|staffing|cloud service|legal service|"
                    + "सॉफ्टवेयर|सल्लागार सेवा|परामर्श सेवा)\\b");

    private static final Pattern CEMENT = Pattern.compile("(?iu)\\bcement\\b|सीमेंट|सिमेंट");
    private static final Pattern CEMENT_BAG = Pattern.compile("(?iu)\\b(bag|sack|woven sack)\\b|बोरी|पोती");
    private static final Pattern CABLE = Pattern.compile(
            "(?iu)\\bcables?\\b|\\b(?:electric|electrical|power)\\s+wires?\\b|\\bwires?\\b.*\\belectrical\\b|केबल|विद्युत तार");
    private static final Pattern HELMET = Pattern.compile("(?iu)\\bhelmets?\\b|हेलमेट");
    private static final Pattern GAS_VALVE = Pattern.compile(
            "(?iu)\\b(?:lpg|gas|cylinder)\\s+valves?\\b|\\bvalves?\\b.*\\b(lpg|gas|cylinder)\\b"
                    + "|\\b(lpg|gas|cylinder)\\b.*\\bvalves?\\b|(?:lpg|gas|cylinder).*वाल्व|(?:lpg|gas|cylinder).*व्हॉल्व");
    private static final Pattern FIRE_EXTINGUISHER = Pattern.compile(
            "(?iu)\\bfire\\s*extinguishers?\\b|\\bextinguishers?\\b|अग्निशामक");
    private static final Pattern FOOD_CONTACT_PLASTIC = Pattern.compile(
            "(?iu)(?=.*\\b(food|foodstuffs?|pharmaceuticals?|drinking water|food packaging|"
                    + "feeding bottle|packaged water)\\b)"
                    + "(?=.*\\b(plastic|polyethylene|polypropylene|pvc|polystyrene|pet|pbt|bottle|packaging)\\b)"
                    + ".*|खाद्य.*(प्लास्टिक|पैकेजिंग)|प्लास्टिक.*(खाद्य|पैकेजिंग|बोतल)");

    public RequirementAnalysisResponse analyze(RequirementAnalysisRequest request) {
        if (request == null || request.getRequirement() == null || request.getRequirement().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement is required");
        }

        String requirement = request.getRequirement().trim();
        List<Answer> suppliedAnswers = request.getAnswers() == null ? List.of() : request.getAnswers();
        Map<String, Answer> answersByQuestion = validateAnswers(suppliedAnswers);
        RequirementAnalysisResponse response = new RequirementAnalysisResponse();
        response.setOriginalRequirement(requirement);
        response.setInterpretedRequirement(buildInterpretedRequirement(requirement, suppliedAnswers));
        response.setProvidedAnswers(toProvidedAnswers(suppliedAnswers));
        Answer standardReferenceAnswer = answersByQuestion.get("reference.is_number");
        if (standardReferenceAnswer != null && standardReferenceAnswer.getOtherText() != null
                && !standardReferenceAnswer.getOtherText().isBlank()) {
            response.setUserProvidedStandardReference(standardReferenceAnswer.getOtherText().trim());
            response.setStandardReferenceVerificationStatus(
                    standardRepository.existsById(standardReferenceAnswer.getOtherText().trim())
                            ? "FOUND_IN_DATABASE"
                            : "NOT_FOUND_IN_DATABASE");
            response.setStandardReferenceApplicabilityStatus("NOT_ASSESSED");
        }
        FamilyDetection detection = detectFamilies(requirement);

        if (detection.multipleFamilies()) {
            response.setStatus(AnalysisStatus.UNCERTAIN);
            response.getReasons().add(new Reason(
                    "requirement.multiple_product_families",
                    "requirement.explanation.multiple_product_families",
                    "The input appears to contain more than one supported product family, so it should be separated before attribute-level analysis. Supplied answers are retained but cannot be reassessed against a single family."
            ));
            return response;
        }

        if (detection.family() == null && !answersByQuestion.isEmpty()) {
            throw badRequest("Clarification answers do not match a supported product family in the requirement");
        }

        if (detection.family() == null) {
            if (UNSUPPORTED_SERVICE.matcher(requirement).find()) {
                response.setStatus(AnalysisStatus.UNSUPPORTED);
                response.getReasons().add(new Reason(
                        "requirement.explicitly_out_of_coverage",
                        "requirement.explanation.explicitly_out_of_coverage",
                        "The input describes a service type that is outside the product-standard rule coverage in the current catalog subset."
                ));
            } else {
                response.setStatus(AnalysisStatus.UNCERTAIN);
                response.getReasons().add(new Reason(
                        "requirement.product_family_unrecognized",
                        "requirement.explanation.product_family_unrecognized",
                        "The product family could not be mapped reliably to a currently supported analysis rule. This does not establish that no relevant Indian Standard exists."
                ));
            }
            return response;
        }

        Family family = detection.family();
        response.setCategory(family.category);
        response.setProductFamilyId(family.id);
        List<QuestionDefinition> relevantQuestions = relevantQuestions(family, requirement, answersByQuestion);
        validateAnswersApplyToFamily(answersByQuestion, relevantQuestions, family, requirement);
        response.setIdentifiedSpecifications(identifiedSpecifications(family, requirement));
        Answer cableVoltageAnswer = answersByQuestion.get("electrical_cable.voltage");
        if (family == Family.ELECTRICAL_CABLE
                && ("above_1100v".equals(cableVoltage(requirement))
                || cableVoltageAnswer != null && "above_1100v".equals(cableVoltageAnswer.getOptionId()))) {
            response.setStatus(AnalysisStatus.UNSUPPORTED);
            response.getReasons().add(new Reason(
                    "requirement.variant_outside_rule_coverage",
                    "requirement.explanation.variant_outside_rule_coverage",
                    "The specified cable voltage is above the range represented by the cable standards in the current analysis subset. No wider coverage is inferred."
            ));
            return response;
        }

        boolean unresolved = false;
        boolean unclassifiedOther = false;
        for (QuestionDefinition definition : relevantQuestions) {
            if (inputValue(definition.id, requirement) != null) continue;
            Answer answer = answersByQuestion.get(definition.id);
            InformationStatus informationStatus = answerStatus(answer);
            if (informationStatus == InformationStatus.KNOWN) continue;
            response.getMaterialMissingAttributes().add(
                    new MaterialAttribute(definition.attributeId, definition.attributeLabelKey, informationStatus));

            if (informationStatus == InformationStatus.UNANSWERED
                    || informationStatus == InformationStatus.UNKNOWN) {
                response.getClarificationQuestions().add(toQuestion(definition));
                unresolved = true;
            } else if (informationStatus == InformationStatus.UNRESOLVED) {
                unclassifiedOther = true;
                unresolved = true;
            }
        }

        if (unclassifiedOther) {
            response.setStatus(AnalysisStatus.UNCERTAIN);
            response.getReasons().add(new Reason(
                    "requirement.other_answer_unclassified",
                    "requirement.explanation.other_answer_unclassified",
                    "A free-text answer was recorded, but this rule set cannot map it to a supported product variant. It is retained as user-provided information and is not interpreted as a verified specification."
            ));
        } else if (unresolved) {
            response.setStatus(AnalysisStatus.AMBIGUOUS);
            response.getReasons().add(new Reason(
                    "requirement.material_attribute_unresolved",
                    "requirement.explanation.material_attribute_unresolved",
                    "One or more product-specific attributes that can change the applicable standard are unknown or unanswered. They are not inferred from the requirement."
            ));
        } else {
            response.setStatus(AnalysisStatus.CLEAR);
            response.getReasons().add(new Reason(
                    "requirement.covered_attributes_sufficient",
                    "requirement.explanation.covered_attributes_sufficient",
                    "The material attributes covered by this product-family rule are specified. This analysis does not confirm that any standard applies or establish compliance."
            ));
        }
        if (response.getStatus() != AnalysisStatus.CLEAR) {
            response.setClarificationQuestions(toQuestions(familyQuestionDefinitions(family, requirement, answersByQuestion)));
        } else if (answersByQuestion.containsKey("reference.is_number")) {
            response.setClarificationQuestions(List.of(toQuestion(questionById("reference.is_number"))));
        }
        return response;
    }

    private Map<String, Answer> validateAnswers(List<Answer> answers) {
        Map<String, Answer> answersByQuestion = new LinkedHashMap<>();
        for (Answer answer : answers) {
            if (answer == null || answer.getQuestionId() == null || answer.getOptionId() == null) {
                throw badRequest("Each clarification answer must include questionId and optionId");
            }
            QuestionDefinition definition = questionById(answer.getQuestionId());
            if (definition == null || definition.option(answer.getOptionId()) == null) {
                throw badRequest("Unknown clarification question or answer option");
            }
            if (answersByQuestion.putIfAbsent(answer.getQuestionId(), answer) != null) {
                throw badRequest("A clarification question may only be answered once");
            }
        }
        return answersByQuestion;
    }

    private void validateAnswersApplyToFamily(Map<String, Answer> answers,
                                              List<QuestionDefinition> relevant,
                                              Family family,
                                              String requirement) {
        for (String questionId : answers.keySet()) {
            if ("reference.is_number".equals(questionId)) continue;
            QuestionDefinition definition = questionById(questionId);
            boolean optionalFamilyQuestion = definition != null
                    && !definition.material
                    && definition.familyId.equals(family.id);
            if (definition == null || !definition.familyId.equals(family.id)
                    || relevant.stream().noneMatch(item -> item.id.equals(questionId)) && !optionalFamilyQuestion
                    || inputValue(questionId, requirement) != null) {
                throw badRequest("A supplied clarification answer is not applicable to the current requirement");
            }
        }
    }

    private List<QuestionDefinition> relevantQuestions(Family family, String requirement,
                                                       Map<String, Answer> answers) {
        List<QuestionDefinition> result = new ArrayList<>();
        switch (family) {
            case CEMENT -> {
                result.add(questionById("cement.type"));
                String effectiveType = cementType(requirement);
                if (effectiveType == null) effectiveType = knownOption(answers.get("cement.type"));
                if ("ordinary_portland".equals(effectiveType)) {
                    result.add(questionById("cement.grade"));
                }
            }
            case ELECTRICAL_CABLE -> {
                result.add(questionById("electrical_cable.design"));
                result.add(questionById("electrical_cable.voltage"));
            }
            case HELMET -> result.add(questionById("helmet.use"));
            case GAS_VALVE -> result.add(questionById("gas_valve.service"));
            case FIRE_EXTINGUISHER -> result.add(questionById("fire_extinguisher.medium"));
            case FOOD_CONTACT_PLASTIC -> {
                result.add(questionById("food_contact_plastic.material"));
                result.add(questionById("food_contact_plastic.contact_use"));
            }
        }
        return result;
    }

    private List<QuestionDefinition> familyQuestionDefinitions(Family family, String requirement,
                                                               Map<String, Answer> answers) {
        List<QuestionDefinition> result = new ArrayList<>(relevantQuestions(family, requirement, answers));
        switch (family) {
            case CEMENT -> result.add(questionById("cement.application"));
            case ELECTRICAL_CABLE -> result.add(questionById("electrical_cable.conductor"));
            case FIRE_EXTINGUISHER -> result.add(questionById("fire_extinguisher.form"));
            case FOOD_CONTACT_PLASTIC -> result.add(questionById("food_contact_plastic.product_form"));
            case HELMET, GAS_VALVE -> {
            }
        }
        boolean hasUnresolvedMaterial = relevantQuestions(family, requirement, answers).stream()
                .anyMatch(definition -> inputValue(definition.id, requirement) == null
                        && answerStatus(answers.get(definition.id)) != InformationStatus.KNOWN);
        if (hasUnresolvedMaterial || answers.containsKey("reference.is_number")) {
            result.add(questionById("reference.is_number"));
        }
        return result.stream()
                .filter(definition -> answers.containsKey(definition.id)
                        || inputValue(definition.id, requirement) == null)
                .distinct()
                .toList();
    }

    private FamilyDetection detectFamilies(String text) {
        List<Family> matches = new ArrayList<>();
        if (CEMENT.matcher(text).find() && !CEMENT_BAG.matcher(text).find()) matches.add(Family.CEMENT);
        if (CABLE.matcher(text).find()) matches.add(Family.ELECTRICAL_CABLE);
        if (HELMET.matcher(text).find()) matches.add(Family.HELMET);
        if (GAS_VALVE.matcher(text).find()) matches.add(Family.GAS_VALVE);
        if (FIRE_EXTINGUISHER.matcher(text).find()) matches.add(Family.FIRE_EXTINGUISHER);
        if (FOOD_CONTACT_PLASTIC.matcher(text).find()) matches.add(Family.FOOD_CONTACT_PLASTIC);
        if (matches.size() != 1) return new FamilyDetection(null, matches.size() > 1);
        return new FamilyDetection(matches.getFirst(), false);
    }

    private String cementType(String text) {
        if (matches(text, "(?iu)\\b(OPC|ordinary\\s+portland)\\b|साधारण पोर्टलैंड")) return "ordinary_portland";
        if (matches(text, "(?iu)\\b(PPC|portland\\s+pozzolana|pozzolana)\\b|पोर्टलैंड पोज़ोलाना|पोज़ोलाना")) return "pozzolana";
        if (matches(text, "(?iu)\\b(PSC|portland\\s+slag|slag\\s+cement)\\b|पोर्टलैंड स्लॅग|स्लॅग सिमेंट")) return "slag";
        return null;
    }

    private String cableConductor(String text) {
        if (matches(text, "(?iu)\\brigid\\s+(?:cable\\s+)?conductors?\\b")) return "rigid";
        if (matches(text, "(?iu)\\bflexible\\s+(?:cable\\s+)?conductors?\\b")) return "flexible";
        return null;
    }

    private String cableVoltage(String text) {
        if (matches(text, "(?iu)(?:above|over|greater than|>\\s*)\\s*1,?100\\s*(?:v|volts?)")) {
            return "above_1100v";
        }
        if (matches(text, "(?iu)(?:up to|upto|not exceeding|≤|<=)\\s*1,?100\\s*(?:v|volts?)"
                + "|\\b1,?100\\s*(?:v|volts?)\\b")) {
            return "up_to_1100v";
        }
        return null;
    }

    private String cementGrade(String text) {
        var matcher = Pattern.compile("(?iu)\\b(33|43|53)\\s*(?:grade|ग्रेड)?\\b").matcher(text);
        return matcher.find() ? "grade_" + matcher.group(1) : null;
    }

    private String cableDesign(String text) {
        if (matches(text, "(?iu)\\bXLPE\\b|क्रॉसलिंक्ड पॉलीएथिलीन")) return "xlpe";
        if (matches(text, "(?iu)\\bheavy[- ]duty\\b|भारी-ड्यूटी")) return "pvc_heavy_duty";
        if (matches(text, "(?iu)\\b(flexible|appliance)\\s+cables?\\b|लवचिक केबल")) return "flexible_appliance";
        if (matches(text, "(?iu)\\bPVC\\b.*\\b(general|supply|power)\\b")) return "pvc_general";
        return null;
    }

    private String helmetUse(String text) {
        if (matches(text, "(?iu)\\b(two[- ]wheeler|motorcycle|motorbike|rider)\\b|दुचाकी|मोटरसायकल")) {
            return "two_wheeler";
        }
        if (matches(text, "(?iu)\\bindustrial\\b|औद्योगिक")) return "industrial";
        return null;
    }

    private String gasService(String text) {
        if (matches(text, "(?iu)\\bLPG\\b|द्रवरूप पेट्रोलियम गॅस")) return "lpg";
        if (matches(text, "(?iu)\\b(compressed|CNG|industrial)\\s+gas\\b|संकुचित वायू")) return "compressed_gas";
        return null;
    }

    private String extinguisherMedium(String text) {
        return matches(text, "(?iu)\\b(dry[- ]powder|ABC powder)\\b|कोरडी पावडर") ? "dry_powder" : null;
    }

    private String plasticMaterial(String text) {
        if (matches(text, "(?iu)\\b(polyethylene|HDPE|LDPE|\\bPE\\b)\\b|पॉलीइथिलीन")) return "polyethylene";
        if (matches(text, "(?iu)\\b(polypropylene|\\bPP\\b)\\b|पॉलीप्रोपिलीन")) return "polypropylene";
        if (matches(text, "(?iu)\\b(PVC|polyvinyl chloride)\\b|पीव्हीसी")) return "pvc";
        if (matches(text, "(?iu)\\b(polystyrene|\\bPS\\b)\\b|पॉलीस्टायरीन")) return "polystyrene";
        if (matches(text, "(?iu)\\b(PET|PBT|polyalkylene terephthalates?)\\b")) return "pet_pbt";
        return null;
    }

    private String plasticContactUse(String text) {
        if (matches(text, "(?iu)\\b(pharmaceuticals?|medicines?)\\b|औषध")) return "pharmaceuticals";
        if (matches(text, "(?iu)\\b(drinking|potable)\\s+water\\b|पिण्याचे पाणी|पेयजल")) return "drinking_water";
        if (matches(text, "(?iu)\\b(food|foodstuffs?)\\b|खाद्य|अन्न")) return "foodstuffs";
        return null;
    }

    private boolean isKnownAnswer(Answer answer) {
        return answer != null && answerStatus(answer) == InformationStatus.KNOWN;
    }

    private String inputValue(String questionId, String text) {
        return switch (questionId) {
            case "cement.type" -> cementType(text);
            case "cement.grade" -> cementGrade(text);
            case "electrical_cable.design" -> cableDesign(text);
            case "electrical_cable.voltage" -> cableVoltage(text);
            case "electrical_cable.conductor" -> cableConductor(text);
            case "helmet.use" -> helmetUse(text);
            case "gas_valve.service" -> gasService(text);
            case "fire_extinguisher.medium" -> extinguisherMedium(text);
            case "food_contact_plastic.material" -> plasticMaterial(text);
            case "food_contact_plastic.contact_use" -> plasticContactUse(text);
            default -> null;
        };
    }

    private List<IdentifiedSpecification> identifiedSpecifications(Family family, String requirement) {
        return QUESTIONS.stream()
                .filter(definition -> definition.familyId.equals(family.id))
                .map(definition -> {
                    String valueId = inputValue(definition.id, requirement);
                    if (valueId == null) return null;
                    OptionDefinition option = definition.option(valueId);
                    return option == null ? null
                            : new IdentifiedSpecification(definition.attributeId, definition.attributeLabelKey,
                            option.displayValue);
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    private String knownOption(Answer answer) {
        return isKnownAnswer(answer) && !"other".equals(answer.getOptionId()) ? answer.getOptionId() : null;
    }

    private InformationStatus answerStatus(Answer answer) {
        if (answer == null) return InformationStatus.UNANSWERED;
        if ("not_sure".equals(answer.getOptionId())) return InformationStatus.UNKNOWN;
        if ("reference.is_number".equals(answer.getQuestionId())) {
            return answer.getOtherText() == null || answer.getOtherText().isBlank()
                    ? InformationStatus.UNKNOWN
                    : InformationStatus.UNRESOLVED;
        }
        if ("other".equals(answer.getOptionId()) || "other_medium".equals(answer.getOptionId())) {
            return answer.getOtherText() == null || answer.getOtherText().isBlank()
                    ? InformationStatus.UNKNOWN
                    : InformationStatus.UNRESOLVED;
        }
        return InformationStatus.KNOWN;
    }

    private ClarificationQuestion toQuestion(QuestionDefinition definition) {
        ClarificationQuestion question = new ClarificationQuestion();
        question.setId(definition.id);
        question.setAttributeId(definition.attributeId);
        question.setPromptKey(definition.promptKey);
        question.setMaterial(definition.material);
        question.setOptions(definition.options.stream()
                .map(option -> new Option(option.id, option.labelKey, option.status, option.otherTextAllowed))
                .toList());
        return question;
    }

    private List<ClarificationQuestion> toQuestions(List<QuestionDefinition> definitions) {
        return definitions.stream().map(this::toQuestion).toList();
    }

    private List<ProvidedAnswer> toProvidedAnswers(List<Answer> answers) {
        return answers.stream()
                .map(answer -> {
                    ProvidedAnswer providedAnswer = new ProvidedAnswer(
                            answer.getQuestionId(),
                            answer.getOptionId(),
                            answerStatus(answer),
                            answer.getOtherText());
                    if (answerStatus(answer) == InformationStatus.KNOWN) {
                        QuestionDefinition definition = questionById(answer.getQuestionId());
                        OptionDefinition option = definition == null ? null : definition.option(answer.getOptionId());
                        providedAnswer.setInterpretedValue(option == null ? null : option.displayValue);
                    }
                    return providedAnswer;
                })
                .toList();
    }

    private String buildInterpretedRequirement(String requirement, List<Answer> answers) {
        List<String> details = answers.stream()
                .filter(answer -> answerStatus(answer) == InformationStatus.KNOWN)
                .filter(answer -> !"reference.is_number".equals(answer.getQuestionId()))
                .map(answer -> {
                    QuestionDefinition definition = questionById(answer.getQuestionId());
                    OptionDefinition selected = definition == null ? null : definition.option(answer.getOptionId());
                    String value = selected == null ? answer.getOptionId() : selected.displayValue;
                    return definition.attributeId + "=" + value;
                })
                .toList();
        if (details.isEmpty()) return requirement;
        return requirement + "\n\nUser-provided clarification: " + String.join("; ", details);
    }

    private QuestionDefinition questionById(String id) {
        return QUESTIONS.stream().filter(question -> question.id.equals(id)).findFirst().orElse(null);
    }

    private static boolean matches(String text, String regex) {
        return Pattern.compile(regex).matcher(text).find();
    }

    private static QuestionDefinition question(String id, String attributeId, String promptKey,
                                               String attributeLabelKey, String familyId,
                                               OptionDefinition... options) {
        return new QuestionDefinition(id, attributeId, promptKey, attributeLabelKey, familyId, true, List.of(options));
    }

    private static QuestionDefinition supplementalQuestion(String id, String attributeId, String promptKey,
                                                            String attributeLabelKey, String familyId,
                                                            OptionDefinition... options) {
        return new QuestionDefinition(id, attributeId, promptKey, attributeLabelKey, familyId, false, List.of(options));
    }

    private static OptionDefinition option(String id, String labelKey) {
        return new OptionDefinition(id, labelKey, InformationStatus.KNOWN, humanize(id), false);
    }

    private static OptionDefinition unknownOption() {
        return new OptionDefinition("not_sure", "requirement.option.not_sure", InformationStatus.UNKNOWN, null, false);
    }

    private static OptionDefinition otherOption() {
        return otherOption("other");
    }

    private static OptionDefinition otherOption(String id) {
        return new OptionDefinition(id, "requirement.option.other", InformationStatus.UNKNOWN, null, true);
    }

    private static OptionDefinition referenceOption() {
        return new OptionDefinition("is_number_provided", "requirement.option.enter_is_number",
                InformationStatus.UNRESOLVED, null, true);
    }

    private static String humanize(String value) {
        return switch (value) {
            case "ordinary_portland" -> "Ordinary Portland cement";
            case "pozzolana" -> "Portland pozzolana cement";
            case "slag" -> "Portland slag cement";
            case "grade_33" -> "33 grade";
            case "grade_43" -> "43 grade";
            case "grade_53" -> "53 grade";
            case "pvc_general" -> "PVC general supply/power cable";
            case "pvc_heavy_duty" -> "PVC heavy-duty cable";
            case "xlpe" -> "XLPE cable";
            case "flexible_appliance" -> "Flexible appliance cable";
            case "up_to_1100v" -> "Up to and including 1100 V";
            case "above_1100v" -> "Above 1100 V";
            case "industrial" -> "Industrial use";
            case "two_wheeler" -> "Two-wheeler rider use";
            case "lpg" -> "LPG service";
            case "compressed_gas" -> "Compressed-gas service";
            case "dry_powder" -> "Dry-powder medium";
            case "polyethylene" -> "Polyethylene";
            case "polypropylene" -> "Polypropylene";
            case "pvc" -> "PVC";
            case "polystyrene" -> "Polystyrene";
            case "pet_pbt" -> "PET/PBT";
            case "general_construction" -> "General construction";
            case "concrete_infrastructure" -> "Concrete/foundations/infrastructure";
            case "rigid" -> "Rigid conductor";
            case "flexible" -> "Flexible conductor";
            case "portable" -> "Portable extinguisher";
            case "mobile" -> "Mobile extinguisher";
            case "foodstuffs" -> "Foodstuffs";
            case "pharmaceuticals" -> "Pharmaceuticals";
            case "drinking_water" -> "Drinking water";
            case "packaging" -> "Food packaging";
            case "feeding_bottle" -> "Feeding bottle";
            default -> value.replace('_', ' ');
        };
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private enum Family {
        CEMENT("CEMENT", "Civil / Construction"),
        ELECTRICAL_CABLE("ELECTRICAL_CABLE", "Electrical / Electronics"),
        HELMET("HELMET", "Safety Equipment"),
        GAS_VALVE("GAS_VALVE", "Safety Equipment"),
        FIRE_EXTINGUISHER("FIRE_EXTINGUISHER", "Safety Equipment"),
        FOOD_CONTACT_PLASTIC("FOOD_CONTACT_PLASTIC", "Packaging");

        private final String id;
        private final String category;

        Family(String id, String category) {
            this.id = id;
            this.category = category;
        }
    }

    private record FamilyDetection(Family family, boolean multipleFamilies) {
    }

    private record OptionDefinition(String id, String labelKey, InformationStatus status,
                                    String displayValue, boolean otherTextAllowed) {
    }

    private static final class QuestionDefinition {
        private final String id;
        private final String attributeId;
        private final String promptKey;
        private final String attributeLabelKey;
        private final String familyId;
        private final boolean material;
        private final List<OptionDefinition> options;

        private QuestionDefinition(String id, String attributeId, String promptKey,
                                   String attributeLabelKey, String familyId,
                                   boolean material,
                                   List<OptionDefinition> options) {
            this.id = id;
            this.attributeId = attributeId;
            this.promptKey = promptKey;
            this.attributeLabelKey = attributeLabelKey;
            this.familyId = familyId;
            this.material = material;
            this.options = options;
        }

        private OptionDefinition option(String optionId) {
            return options.stream().filter(option -> option.id.equals(optionId)).findFirst().orElse(null);
        }
    }
}
