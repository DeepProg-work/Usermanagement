// app/sorting/page.tsx (or your desired path)
'use client';

import React, { useState, useEffect } from 'react';
import BubbleSortVisualizer from "@/components/threeJs/sorting/bubblesort"; // Adjust path if needed
import InsertionSortVisualizer from "@/components/threeJs/sorting/insertionsort"; // Adjust path if needed
import MergeSortVisualizer from "@/components/threeJs/sorting/mergesort"; // Adjust path if needed
import SelectionSortVisualizer from "@/components/threeJs/sorting/selectionsort"; // Adjust path if needed

// Define the types for our algorithms
type AlgorithmId = 'bubble' | 'insertion' | 'selection' | 'merge';

interface AlgorithmOption {
  id: AlgorithmId;
  name: string;
  description: string;
  Component: React.FC<{ initialArray: number[] }>; // Specify prop type
}

// Define the available algorithms
const algorithms: AlgorithmOption[] = [
  {
    id: 'bubble',
    name: 'Bubble Sort',
    description: 'A simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
    Component: BubbleSortVisualizer,
  },
  {
    id: 'insertion',
    name: 'Insertion Sort',
    description: 'Builds the final sorted array one item at a time. It is much less efficient on large lists than more advanced algorithms such as quicksort, heapsort, or merge sort.',
    Component: InsertionSortVisualizer,
  },
  {
    id: 'selection',
    name: 'Selection Sort',
    description: 'An in-place comparison sorting algorithm. It has an O(n²) time complexity, which makes it inefficient on large lists.',
    Component: SelectionSortVisualizer,
  },
  {
    id: 'merge',
    name: 'Merge Sort',
    description: 'An efficient, stable, comparison-based sorting algorithm. Most implementations produce a stable sort, meaning that the order of equal elements is the same in the input and output.',
    Component: MergeSortVisualizer,
  },
];

const DEFAULT_ARRAY = [8, 3, 5, 1, 9, 2, 7, 4, 6];

export default function SortingPage() {
  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState<AlgorithmId>('bubble');
  const [arrayInputString, setArrayInputString] = useState<string>(DEFAULT_ARRAY.join(', '));
  const [currentArray, setCurrentArray] = useState<number[]>(DEFAULT_ARRAY);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAlgorithmChange = (algoId: AlgorithmId) => {
    setSelectedAlgorithmId(algoId);
  };

  const handleArrayInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setArrayInputString(event.target.value);
    setInputError(null);
  };

  const handleSetArray = () => {
    setInputError(null);
    const newArrayValues = arrayInputString
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '');

    if (newArrayValues.length === 0) {
      setInputError("Array cannot be empty. Using default.");
      setCurrentArray([...DEFAULT_ARRAY]);
      setArrayInputString(DEFAULT_ARRAY.join(', '));
      return;
    }

    const parsedNumbers: number[] = [];
    for (const val of newArrayValues) {
      const num = parseInt(val, 10);
      if (isNaN(num)) {
        setInputError(`Invalid input: "${val}" is not a valid number. Please use comma-separated numbers.`);
        return;
      }
      parsedNumbers.push(num);
    }

    setCurrentArray(parsedNumbers);
  };

  const SelectedVisualizer = algorithms.find(algo => algo.id === selectedAlgorithmId)?.Component;
  const selectedAlgorithmInfo = algorithms.find(algo => algo.id === selectedAlgorithmId);

  const visualizerKey = `${selectedAlgorithmId}-${currentArray.join('-')}`;


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 py-6 sm:py-8 px-4">
      <div className="container mx-auto">
 

        {/* Tab Navigation for Algorithm Selection */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-center border-b border-slate-700">
            {algorithms.map((algo) => (
              <button
                key={algo.id}
                onClick={() => handleAlgorithmChange(algo.id)}
                className={`
                  px-4 py-2 sm:px-6 sm:py-3 -mb-px 
                  text-sm sm:text-base font-medium transition-colors duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50
                  ${
                    selectedAlgorithmId === algo.id
                      ? 'border-b-2 border-sky-400 text-sky-400'
                      : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }
                `}
              >
                {algo.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Algorithm Information, Visualizer, and Array Input Section */}
        {selectedAlgorithmInfo && SelectedVisualizer && (
          <section className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-2xl">
            {/* Algorithm Info */}
            <div className="text-center mb-4 sm:mb-6">
 
            </div>

            {/* Visualizer */}
            <div className="mb-8 sm:mb-10">
                <SelectedVisualizer key={visualizerKey} initialArray={currentArray} />
            </div>
            
            {/* Array Input Section - Integrated at the bottom of this section */}
            <div className="pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-sky-300 mb-3 text-center sm:text-left">Customize Array</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
                <div className="flex-grow w-full sm:w-auto">
                  <label htmlFor="arrayInput" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                    Enter numbers (comma-separated):
                  </label>
                  <input
                    type="text"
                    id="arrayInput"
                    value={arrayInputString}
                    onChange={handleArrayInputChange}
                    placeholder="e.g., 5, 1, 8, 4, 2"
                    className="w-full p-2 sm:p-2.5 rounded-md bg-slate-700 border border-slate-600 text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors text-sm"
                  />
                </div>
                <button
                  onClick={handleSetArray}
                  className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-md transition-colors text-white font-medium text-sm"
                >
                  Set Array & Visualize
                </button>
              </div>
              {inputError && (
                <p className="text-red-400 text-xs sm:text-sm mt-2 text-center sm:text-left">{inputError}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
