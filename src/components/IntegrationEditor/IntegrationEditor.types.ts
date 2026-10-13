export type IntegrationEditorDefinition = {
  name: string;
  fields: ReadonlyArray<readonly [string, string]>;
};

export type IntegrationEditorProps = {
  serviceKey: string;
  definition?: IntegrationEditorDefinition;
  onToast: (message: string) => void;
  onTest: (name: string, settings: Record<string, string>) => Promise<void>;
  onSaved: () => void;
  onCancel: () => void;
};
