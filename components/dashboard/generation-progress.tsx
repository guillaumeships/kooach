'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type GenerationStep = 'preparing' | 'generating' | 'formatting' | 'saving' | 'complete';

interface GenerationProgressProps {
  currentStep: GenerationStep;
  isComplete: boolean;
}

const STEPS: Record<GenerationStep, { label: string }> = {
  preparing: { label: 'Vérification…' },
  generating: { label: 'Génération en cours…' },
  formatting: { label: 'Formatage…' },
  saving: { label: 'Sauvegarde…' },
  complete: { label: 'Terminé !' },
};

const STEP_ORDER: GenerationStep[] = [
  'preparing',
  'generating',
  'formatting',
  'saving',
  'complete',
];

export function GenerationProgress({ currentStep }: GenerationProgressProps) {
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEP_ORDER.length) * 100;

  return (
    <div className="w-full space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Génération en cours</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="space-y-2">
        {STEP_ORDER.map((step, idx) => {
          const isActive = step === currentStep;
          const isCompleted = idx < currentStepIndex;
          const stepData = STEPS[step];
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
                isActive && 'border-primary/30 bg-primary-subtle',
                isCompleted && 'border-primary-muted bg-primary-subtle/40',
                !isActive && !isCompleted && 'border-border bg-muted/40'
              )}
            >
              <div className="shrink-0">
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-4 w-4 text-primary" />
                  </motion.div>
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-border" />
                )}
              </div>
              <span
                className={cn(
                  'text-[13px] font-medium',
                  isActive && 'text-primary',
                  isCompleted && 'text-primary/80',
                  !isActive && !isCompleted && 'text-muted-foreground'
                )}
              >
                {stepData.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
