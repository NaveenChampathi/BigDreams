let gainersPollingIntervalId = null;
let haltsPollingIntervalId = null;

const registerGainersPollingId = (_id) => {
    if(gainersPollingIntervalId) {
        clearInterval(gainersPollingIntervalId);
    }
    gainersPollingIntervalId = _id;
}


const unRegisterGainersPolling = () => {
    clearInterval(gainersPollingIntervalId);
}
const registerHaltsPollingId = (_id) => {
    if(haltsPollingIntervalId) {
        clearInterval(haltsPollingIntervalId);
    }
    haltsPollingIntervalId = _id;
}


const unRegisterHaltsPolling = () => {
    clearInterval(haltsPollingIntervalId);
}

module.exports = {
    registerGainersPollingId,
    unRegisterGainersPolling,
    registerHaltsPollingId,
    unRegisterHaltsPolling
}