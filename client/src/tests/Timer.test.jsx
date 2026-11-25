import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Timer from '../components/Timer/Timer';

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-24T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays formatted countdown and triggers onExpire once when reaching 00:00', () => {
    const onExpire = vi.fn();
    const expiresAt = new Date('2026-11-24T12:00:03.000Z').toISOString();

    render(<Timer expiresAt={expiresAt} onExpire={onExpire} />);

    expect(screen.getByText('00:03')).toBeInTheDocument();
    expect(onExpire).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(onExpire).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
