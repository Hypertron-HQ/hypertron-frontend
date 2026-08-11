export type MockWorkspace = {
  id: string;
  name: string;
  initial: string;
  members: number;
  tier: string;
  role: "Owner" | "Admin" | "Member";
};

export const MOCK_WORKSPACES: MockWorkspace[] = [
  {
    id: "design-test",
    name: "DesignTest Co.",
    initial: "D",
    members: 6,
    tier: "Tier 1",
    role: "Owner",
  },
  {
    id: "main-1",
    name: "Main Workspace",
    initial: "M",
    members: 8,
    tier: "Tier 1",
    role: "Owner",
  },
  {
    id: "main-2",
    name: "Main Workspace",
    initial: "M",
    members: 8,
    tier: "Tier 1",
    role: "Owner",
  },
];

export function getMockWorkspace(id: string): MockWorkspace | undefined {
  return MOCK_WORKSPACES.find((workspace) => workspace.id === id);
}
