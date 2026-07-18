import { register } from '@antv/x6-react-shape';
import { IntentFlowNodeReact } from './IntentFlowNodeReact';

register({
  shape: 'intent-node-react',
  width: 248,
  height: 88,
  component: IntentFlowNodeReact,
});
