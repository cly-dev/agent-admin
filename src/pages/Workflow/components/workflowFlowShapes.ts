import { register } from '@antv/x6-react-shape';
import { WorkflowFlowNodeReact } from './WorkflowFlowNodeReact';

register({
  shape: 'workflow-node-react',
  width: 248,
  height: 88,
  component: WorkflowFlowNodeReact,
});
