import PlugControl from '../models/PlugControl.js';

// Status für ESP32 abrufen (ESP32 fragt: "Was soll ich tun?")
export const getDesiredStateForESP = async () => {
  const status = await PlugControl.getStatus();
  await PlugControl.markFetched();
  
  return {
    desired_state: status.desired_state,
    last_changed: status.last_changed
  };
};

// Status für Website abrufen (komplett)
export const getCompleteStatus = async () => {
  return await PlugControl.getStatus();
};

// Gewünschten Status setzen (von Website)
export const setDesiredState = async (state) => {
  if (!['on', 'off'].includes(state)) {
    throw new Error('Status muss "on" oder "off" sein');
  }
  
  return await PlugControl.setDesiredState(state);
};

// Gemeldeten Status aktualisieren (von ESP32)
export const updateReportedState = async (state) => {
  if (!['on', 'off', 'unknown'].includes(state)) {
    throw new Error('Gemeldeter Status muss "on", "off" oder "unknown" sein');
  }
  
  return await PlugControl.updateReportedState(state);
};


