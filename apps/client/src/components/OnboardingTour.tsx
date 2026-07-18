import { useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { EventData, Step, TooltipRenderProps } from 'react-joyride';
import { useTour } from '../context/TourContext';
import { Sparkles, Map, PlusSquare, HelpCircle } from 'lucide-react';

function CustomTooltip({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-80 overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 font-sans"
    >
      <div className="p-6 flex-1 text-gray-800 dark:text-gray-200">
        {step.content}
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800/80 p-4 px-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        {!isLastStep ? (
          <button {...skipProps} className="text-sm font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors px-2 py-1">
            Bỏ qua
          </button>
        ) : (
          <div /> // Spacer
        )}
        
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button {...backProps} className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Quay lại
            </button>
          )}
          <button {...primaryProps} className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0">
            {isLastStep ? 'Hoàn tất 🎉' : 'Tiếp theo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingTour() {
  const { run, finishTour } = useTour();

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-bold mb-2 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Chào mừng bạn mới!</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Dành ra 30 giây để cùng khám phá các tính năng tuyệt vời nhất của hệ thống nhé.
          </p>
        </div>
      ),
      skipBeacon: true,
    },
    {
      target: '.tour-sidebar',
      content: (
        <div>
          <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
            <Map size={20} />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Không gian làm việc</h3>
          </div>
          <p className="text-sm leading-relaxed">Đây là menu chính để bạn quản lý tất cả các Bảng công việc và thành viên nhóm của mình.</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '.tour-create-board',
      content: (
        <div>
          <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
            <PlusSquare size={20} />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Tạo Bảng mới</h3>
          </div>
          <p className="text-sm leading-relaxed">Bạn có thể tạo Bảng mới trực tiếp tại đây để bắt đầu ngay công việc.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-help-button',
      content: (
        <div>
          <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
            <HelpCircle size={20} />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Sổ tay hướng dẫn</h3>
          </div>
          <p className="text-sm leading-relaxed">Nếu bạn cần xem lại cách dùng chi tiết, hãy bấm vào quyển sách này bất cứ lúc nào nhé!</p>
        </div>
      ),
      placement: 'bottom-end',
    },
  ];

  const handleJoyrideCallback = async (data: EventData) => {
    const { status } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      finishTour();
    }
  };

  if (!run) return null;

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      showSkipButton
      steps={steps}
      tooltipComponent={CustomTooltip}
      floaterProps={{
        disableAnimation: true, // We handle animation with Tailwind
      }}
    />
  );
}
