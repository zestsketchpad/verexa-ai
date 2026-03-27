export interface ActionLog {
  id: string;
  timestamp: string;
  inputPrompt: string;
  actionType: 'CODE' | 'EMAIL' | 'SYSTEM';
  riskScore: number;
  decision: 'Approve' | 'Block' | 'Modify';
  override: boolean;
  status: 'Executed' | 'Prevented' | 'In Review';
}

export const MOCK_LOGS: ActionLog[] = [
  {
    id: '1',
    timestamp: 'Oct 24, 14:22:01',
    inputPrompt: 'Generate quarterly financial summary for stakeholders in JSON format',
    actionType: 'CODE',
    riskScore: 0.12,
    decision: 'Approve',
    override: false,
    status: 'Executed',
  },
  {
    id: '2',
    timestamp: 'Oct 24, 14:18:45',
    inputPrompt: 'Draft response to inquiry about upcoming IPO timeline and internal docs',
    actionType: 'EMAIL',
    riskScore: 0.88,
    decision: 'Block',
    override: false,
    status: 'Prevented',
  },
  {
    id: '3',
    timestamp: 'Oct 24, 14:05:12',
    inputPrompt: 'Refactor core API authentication module to include OAuth2.0 support',
    actionType: 'CODE',
    riskScore: 0.54,
    decision: 'Modify',
    override: true,
    status: 'In Review',
  },
  {
    id: '4',
    timestamp: 'Oct 24, 13:58:30',
    inputPrompt: 'Email vendor regarding contract renewal terms for cloud infrastructure',
    actionType: 'EMAIL',
    riskScore: 0.08,
    decision: 'Approve',
    override: false,
    status: 'Executed',
  },
];
