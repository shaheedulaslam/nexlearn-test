'use client';

import { Question, Answer } from '@/app/types';

interface QuestionPaletteProps {
  questions: Question[];
  answers: Answer[];
  currentQuestion: number;
  onQuestionSelect: (index: number) => void;
  onClose?: () => void;
}

export default function QuestionPalette({
  questions,
  answers,
  currentQuestion,
  onQuestionSelect,
  onClose,
}: QuestionPaletteProps) {
  // Status detection - now uses `visited` to distinguish not-visited vs visited-but-not-answered
  const getQuestionStatus = (questionId: number) => {
    const answer = answers.find(a => a.question_id === questionId);

    // Not visited if no record OR visited flag is false
    if (!answer || !answer.visited) {
      return 'not-visited';
    }

    const isAnswered = answer.selected_option_id !== null;
    const isMarked = answer.marked_for_review === true;

    if (isAnswered && isMarked) return 'answered-marked';
    if (isAnswered) return 'answered';
    if (isMarked) return 'marked';

    return 'not-answered'; // visited but not answered
  };

  // counts
  const answeredCount = answers.filter(a => a.selected_option_id !== null).length;
  const markedCount = answers.filter(a => a.marked_for_review === true).length;
  // notVisitedCount should be based on visited flag
  const notVisitedCount = questions.filter(q => {
    const a = answers.find(x => x.question_id === q.id);
    return !(a && a.visited);
  }).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Question Palette:</h4>
        {onClose && (
          <button onClick={onClose} className="text-xs text-gray-500 hidden lg:inline">
            Close
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className="text-center p-2 bg-green-50 rounded border border-green-200">
            <div className="font-semibold text-green-700">{answeredCount}</div>
            <div className="text-green-600">Answered</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded border border-purple-200">
            <div className="font-semibold text-purple-700">{markedCount}</div>
            <div className="text-purple-600">Marked</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
            <div className="font-semibold text-gray-700">{notVisitedCount}</div>
            <div className="text-gray-600">Not Visited</div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {questions.map((question, idx) => {
            const status = getQuestionStatus(question.id);
            const isCurrent = idx === currentQuestion;

            let buttonClass = "w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium border transition-all duration-200 ";
            
            if (isCurrent) {
              buttonClass += "ring-2 ring-[#14232A] ring-offset-1 ";
            }

            switch (status) {
              case 'answered-marked':
                buttonClass += "bg-purple-600 text-white border-purple-600 hover:bg-purple-700";
                break;
              case 'answered':
                buttonClass += "bg-green-500 text-white border-green-500 hover:bg-green-600";
                break;
              case 'marked':
                buttonClass += "bg-purple-600 text-white border-purple-600 hover:bg-purple-700";
                break;
              case 'not-answered':
                buttonClass += "bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600";
                break;
              default: // not-visited
                buttonClass += "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
            }

            return (
              <button
                key={question.id}
                onClick={() => onQuestionSelect(idx)}
                className={buttonClass}
                title={`Question ${idx + 1} - ${getStatusText(status)}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded border border-green-600" /> 
            Answered
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-white border border-gray-400 rounded" /> 
            Not Visited
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-600 rounded border border-purple-700" /> 
            Marked for Review
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded border border-yellow-600" /> 
            Not Answered
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get status text
function getStatusText(status: string): string {
  switch (status) {
    case 'answered':
      return 'Answered';
    case 'not-answered':
      return 'Not Answered';
    case 'marked':
      return 'Marked for Review';
    case 'answered-marked':
      return 'Answered & Marked';
    case 'not-visited':
      return 'Not Visited';
    default:
      return 'Not Visited';
  }
}
