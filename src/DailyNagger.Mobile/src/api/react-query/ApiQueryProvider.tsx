import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

type ApiQueryProviderProps = {
  readonly children: ReactNode;
};

export function ApiQueryProvider({ children }: ApiQueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
