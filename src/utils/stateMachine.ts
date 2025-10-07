export type FlipState = 'IDLE' | 'FIRST_FLIP' | 'SECOND_FLIP' | 'CHECKING';

const TRANSITIONS: Record<FlipState, readonly FlipState[]> = {
  IDLE: ['FIRST_FLIP'],
  FIRST_FLIP: ['SECOND_FLIP', 'IDLE'],
  SECOND_FLIP: ['CHECKING'],
  CHECKING: ['IDLE'],
};

export class FlipStateMachine {
  private current: FlipState = 'IDLE';

  public get state(): FlipState {
    return this.current;
  }

  public canTransition(next: FlipState): boolean {
    return TRANSITIONS[this.current].includes(next);
  }

  public transition(next: FlipState): FlipState {
    if (!this.canTransition(next)) {
      throw new Error(`Invalid flip state transition from ${this.current} to ${next}`);
    }
    this.current = next;
    return this.current;
  }

  public reset(): FlipState {
    this.current = 'IDLE';
    return this.current;
  }
}

export default FlipStateMachine;
