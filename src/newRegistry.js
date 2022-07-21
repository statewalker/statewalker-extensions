export default function newRegistry(onError = console.error) {
    let counter = 0;
    const registrations = {};
    const register = (action) => {
      const id = counter++;
      return (registrations[id] = () => {
        try {
          delete registrations[id];
          return action && action();
        } catch (error) {
          onError(error);
        }
      });
    }
    const clear = () => Object.values(registrations).forEach(r => r());
    return Object.assign([register, clear], { register, clear });
  }