import { ControlWidget, ControlWidgetButton } from 'scripting'
import { RefreshPopular } from './app_intents'
ControlWidget.present(<ControlWidgetButton intent={RefreshPopular(undefined)} label={{title:'Consultar indicadores',systemImage:'chart.line.uptrend.xyaxis'}}/>)
