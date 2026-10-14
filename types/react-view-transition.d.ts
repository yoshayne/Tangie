// React 19.3 ships <ViewTransition>; the installed @types/react does not describe it yet.
import "react";

declare module "react" {
  export const ViewTransition: ExoticComponent<{
    children?: ReactNode;
    name?: string;
    default?: string;
    enter?: string;
    exit?: string;
    share?: string;
    update?: string;
  }>;
}
