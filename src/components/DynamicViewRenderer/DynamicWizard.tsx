import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackgroundImage from '../../../app/components/BackgroundImage';
import DynamicViewRenderer, { ViewJSON } from '../DynamicViewRenderer';
import { DynamicDataApi } from '../../utils/api';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  fields: string[]; // Widget keys for this step
}

export interface DynamicWizardProps {
  viewJson: ViewJSON;
  steps: WizardStep[];
  initialData?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => void;
  onStepChange?: (currentStep: number) => void;
  userRole?: string;
}

const DynamicWizard: React.FC<DynamicWizardProps> = ({
  viewJson,
  steps,
  initialData = {},
  onSubmit,
  onStepChange,
  userRole,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [stepErrors, setStepErrors] = useState<Record<number, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Filter widgets for current step
  const currentStepWidgets = viewJson.widgets.filter((widget: Widget) =>
    currentStepData.fields.includes(widget.key)
  );

  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep]);

  const validateStep = (stepIndex: number): boolean => {
    const step = steps[stepIndex];
    const stepWidgets = viewJson.widgets.filter((widget: Widget) => step.fields.includes(widget.key));
    const errors: Record<string, string> = {};

    stepWidgets.forEach((widget: Widget) => {
      if (widget.required && !formData[widget.key]) {
        errors[widget.key] = `${widget.label || widget.key} is required`;
      }
    });

    setStepErrors((prev) => ({
      ...prev,
      [stepIndex]: errors,
    }));

    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all steps
    let allValid = true;
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        allValid = false;
        if (i !== currentStep) {
          setCurrentStep(i);
          break;
        }
      }
    }

    if (!allValid) {
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
      return;
    }

    // Default submission
    if (!viewJson.defaultEndpoint) {
      console.error('No submission endpoint configured');
      return;
    }

    setSubmitting(true);
    try {
      const schemaName = viewJson.id.split('_')[0];
      await DynamicDataApi.createRecord(schemaName, formData);
      // Success handled by parent
    } catch (error: any) {
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Create a modified viewJson for current step
  const stepViewJson: ViewJSON = {
    ...viewJson,
    widgets: currentStepWidgets,
  };

  return (
    <BackgroundImage>
      <View className="flex-1">
        {/* Progress Indicator */}
        <View className="px-6 pt-12 pb-6">
          <Text className="text-white text-2xl font-bold mb-2">{viewJson.title}</Text>
          <Text className="text-white/80 text-sm mb-6">
            Step {currentStep + 1} of {steps.length}
          </Text>

          {/* Progress Bar */}
          <View className="flex-row gap-2 mb-4">
            {steps.map((step, index) => (
              <View
                key={step.id}
                className={`flex-1 h-2 rounded-full ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-white/20'
                }`}
              />
            ))}
          </View>

          {/* Step Titles */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
            <View className="flex-row gap-4">
              {steps.map((step, index) => (
                <TouchableOpacity
                  key={step.id}
                  onPress={() => {
                    // Only allow navigation to completed or next step
                    if (index <= currentStep + 1) {
                      // Validate previous steps before allowing jump
                      let canNavigate = true;
                      for (let i = 0; i < index; i++) {
                        if (!validateStep(i)) {
                          canNavigate = false;
                          break;
                        }
                      }
                      if (canNavigate) {
                        setCurrentStep(index);
                      }
                    }
                  }}
                  className={`items-center ${index === currentStep ? 'opacity-100' : 'opacity-60'}`}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                      index < currentStep
                        ? 'bg-green-600'
                        : index === currentStep
                        ? 'bg-blue-600'
                        : 'bg-white/20'
                    }`}
                  >
                    {index < currentStep ? (
                      <Ionicons name="checkmark" size={20} color="white" />
                    ) : (
                      <Text className="text-white font-bold">{index + 1}</Text>
                    )}
                  </View>
                  <Text className="text-white text-xs text-center max-w-20" numberOfLines={2}>
                    {step.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Current Step Content */}
        <ScrollView className="flex-1 px-6">
          <View className="mb-6">
            <Text className="text-white text-xl font-semibold mb-2">
              {currentStepData.title}
            </Text>
            {currentStepData.description && (
              <Text className="text-white/60 text-sm mb-6">
                {currentStepData.description}
              </Text>
            )}

            {/* Render form for current step */}
            <View className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
              <DynamicForm
                viewJson={stepViewJson}
                initialData={formData}
                onSubmit={(data) => {
                  setFormData((prev) => ({ ...prev, ...data }));
                }}
                userRole={userRole}
              />
            </View>
          </View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View className="bg-black/50 backdrop-blur-sm px-6 py-4 border-t border-white/10">
          <View className="flex-row gap-3">
            {!isFirstStep && (
              <TouchableOpacity
                onPress={handlePrevious}
                className="flex-1 bg-white/10 rounded-xl py-4 items-center"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="chevron-back" size={20} color="white" />
                  <Text className="text-white font-semibold">Previous</Text>
                </View>
              </TouchableOpacity>
            )}

            {isLastStep ? (
              <TouchableOpacity
                onPress={handleSubmit}
                className="flex-1 bg-blue-600 rounded-xl py-4 items-center"
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text className="text-white font-semibold">Submit</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleNext}
                className="flex-1 bg-blue-600 rounded-xl py-4 items-center"
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-semibold">Next</Text>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Step Error Summary */}
          {stepErrors[currentStep] && Object.keys(stepErrors[currentStep]).length > 0 && (
            <View className="mt-3 bg-red-600/20 rounded-xl p-3">
              <Text className="text-red-400 text-sm font-semibold mb-1">
                Please fix the following errors:
              </Text>
              {Object.values(stepErrors[currentStep]).map((error, index) => (
                <Text key={index} className="text-red-300 text-xs">
                  • {error}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </BackgroundImage>
  );
};

export default DynamicWizard;

