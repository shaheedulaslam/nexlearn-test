"use client";

import Image from "next/image";
import { useState } from "react";

interface Option {
  id: number;
  option: string;
}

interface Question {
  id: number;
  question: string;
  options: Option[];
  marks?: number;
  image?: string | null;
}

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onAnswerSelect: (questionId: number, optionId: number | null) => void;
  questionNumber: number;
  isMarkedForReview?: boolean;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  questionNumber,
  isMarkedForReview = false,
}: QuestionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const optionLabels = ["A", "B", "C", "D"];

  const paragraphContent = `Ancient Indian history spans several millennia and offers a profound glimpse into the origins of one of the world's oldest and most diverse civilizations. It begins with the Indus Valley Civilization (c. 2500–1500 BCE), which is renowned for its advanced urban planning, architecture, and water management systems. Cities like Harappa and Mohenjo-Daro were highly developed, with sophisticated drainage systems and well-organized streets, showcasing the early brilliance of Indian civilization. The decline of this civilization remains a mystery, but it marks the transition to the next significant phase in Indian history.

Following the Indus Valley Civilization, the Vedic Period (c. 1500–600 BCE) saw the arrival of the Aryans in northern India. This period is characterized by the composition of the Vedas, which laid the foundations of Hinduism and early Indian society. 

It was during this time that the varna system (social hierarchy) began to develop, which later evolved into the caste system. The Vedic Age also witnessed the rise of important kingdoms and the spread of agricultural practices across the region, significantly impacting the social and cultural fabric of ancient India.

The 6th century BCE marked a turning point with the emergence of new religious and philosophical movements. Buddhism and Jainism, led by Gautama Buddha and Mahavira, challenged the existing Vedic orthodoxy and offered alternative paths to spiritual enlightenment. These movements gained widespread popularity and had a lasting influence on Indian society and culture. During this time, the kingdom of Magadha became one of the most powerful, laying the groundwork for future empires.

The Maurya Empire (c. 322–185 BCE), founded by Chandragupta Maurya, became the first large empire to unify much of the Indian subcontinent. Under Ashoka the Great, the empire reached its zenith, and Buddhism flourished both in India and abroad. Ashoka's support for non-violence, his spread of Buddhist teachings, and his contributions to governance and infrastructure had a lasting legacy on Indian history. His reign marks one of the earliest and most notable examples of state-sponsored religious tolerance and moral governance.`;


  return (
    <div className="">
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-7xl w-full max-h-[70vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Comprehensive Paragraph
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {paragraphContent}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-[#117A8B] text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-[#0f6a7a] transition-colors"
              >
                Minimize
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Top control (Read paragraph etc) */}
        <div className="p-4 border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#117A8B] text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-[#0f6a7a] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Read Comprehensive Paragraph
            </button>
            
            {/* Mark for Review Badge */}
            {isMarkedForReview && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Marked for Review
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Question Header with Status */}
          <div className="flex items-start mb-4">
            <h3 className="text-base font-medium text-gray-800 flex-1">
              {questionNumber}. {question.question}
            </h3>
          </div>

          {question.image && (
            <div className="mb-4">
              <Image
                src={question.image}
                alt="question image"
                width={320}
                height={200}
                className="rounded shadow-sm object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div className="">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-500">Choose the answer:</div>
        </div>

        <div className="space-y-3">
          {question.options.map((option, i) => {
            const checked = selectedAnswer === option.id;
            const isCorrect = false; // This would come from your results data
            
            return (
              <label
                key={option.id}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  checked
                    ? "border-[#14232A] bg-[#f0f6f8] shadow-sm"
                    : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                } ${isCorrect ? 'ring-1 ring-green-500' : ''}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded border text-sm font-medium ${
                    checked 
                      ? 'bg-[#14232A] text-white border-[#14232A]' 
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}>
                    {optionLabels[i]}
                  </div>
                  <div className="text-sm text-gray-700 flex-1">{option.option}</div>
                </div>

                <div className="flex items-center gap-3">                  
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    checked={checked}
                    onChange={() => onAnswerSelect(question.id, option.id)}
                    className="h-4 w-4 text-[#14232A] border-gray-300 focus:ring-[#14232A]"
                  />
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}