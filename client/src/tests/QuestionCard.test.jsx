import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QuestionCard from '../components/QuestionCard/QuestionCard';

const SAMPLE_QUESTION = {
  id: 10,
  questionText: 'What does typeof null return?',
  optionA: '"null"',
  optionB: '"object"',
  optionC: '"undefined"',
  optionD: '"boolean"',
};

describe('QuestionCard', () => {
  it('renders question counter, prompt, and 4 options, and emits selected key', () => {
    const onSelect = vi.fn();
    render(
      <QuestionCard
        question={SAMPLE_QUESTION}
        questionNumber={3}
        totalQuestions={10}
        selectedAnswer="B"
        onSelectAnswer={onSelect}
      />
    );

    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument();
    expect(screen.getByText('What does typeof null return?')).toBeInTheDocument();

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(radios[2]);
    expect(onSelect).toHaveBeenCalledWith('C');
  });
});
