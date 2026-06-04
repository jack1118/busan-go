import { createContext, useContext } from "react";

// App-wide actions shared with deep components without prop drilling:
// tap an image to enlarge it, or jump from a restaurant to its scheduled stop.
export interface AppCtx {
  openLightbox: (src: string) => void;
  goToStop: (dayId: string, time: string, activity: string) => void;
}

export const AppContext = createContext<AppCtx>({
  openLightbox: () => {},
  goToStop: () => {},
});

export const useAppCtx = () => useContext(AppContext);
