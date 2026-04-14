import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface InfoTooltipProps {
  title: string;
  description: string;
  lawReference?: string;
  example?: string;
}

export function InfoTooltip({ title, description, lawReference, example }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          >
            <Info className="w-3 h-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4 bg-white shadow-xl border-2 border-blue-200">
          <div className="space-y-2">
            <h4 className="text-sm text-blue-900">{title}</h4>
            <p className="text-xs text-gray-700 leading-relaxed">{description}</p>
            {example && (
              <div className="bg-blue-50 rounded p-2 mt-2">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">예시:</span> {example}
                </p>
              </div>
            )}
            {lawReference && (
              <p className="text-xs text-gray-500 border-t pt-2 mt-2">
                <span className="font-semibold">법적근거:</span> {lawReference}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
