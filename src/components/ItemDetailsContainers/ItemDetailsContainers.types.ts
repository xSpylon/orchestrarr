export type ItemDetailsDockerContainer = { name: string; image?: string; status?: string };

export type ItemDetailsContainersProps = {
  containers: ItemDetailsDockerContainer[];
  onLogs: (name: string) => void;
  onAction: (action: 'start' | 'stop' | 'restart', name: string) => void;
};
