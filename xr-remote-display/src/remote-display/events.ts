export type RTCEvents = {
  "rtc:offer": CustomEvent<RTCSessionDescriptionInit>;
  "rtc:answer": CustomEvent<RTCSessionDescriptionInit>;
  "rtc:server:ice": CustomEvent<RTCIceCandidateInit>;
  "rtc:client:ice": CustomEvent<RTCIceCandidateInit>;
};

export interface RTCEventTarget {
  dispatchEvent(e: RTCEvents[keyof RTCEvents]): void;
  addEventListener<T extends keyof RTCEvents>(
    event: T,
    handler: (e: RTCEvents[T]) => any
  ): void;
  removeEventListener<T extends keyof RTCEvents>(
    event: T,
    handler: (e: RTCEvents[T]) => any
  ): void;
}

export const remoteDisplay = new EventTarget() as RTCEventTarget;
