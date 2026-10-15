import type {
  ServicePackageName,
  ServicePackage,
} from "@/services/action-boundary/action-dependencies";

export type RegisteredAction<TServicePackageName extends ServicePackageName, TActionArgs> = {
  readonly servicePackageName: TServicePackageName;
  readonly actionFunction: (
    actionArguments: TActionArgs,
    serviceDependencies: ServicePackage<TServicePackageName>,
  ) => void;
};

export function registerAction<TServicePackageName extends ServicePackageName, TActionArgs>(
  actionFunction: (
    actionArguments: TActionArgs,
    serviceDependencies: ServicePackage<TServicePackageName>,
  ) => void,
  servicePackageName: TServicePackageName,
): RegisteredAction<TServicePackageName, TActionArgs> {
  return { actionFunction, servicePackageName };
}
