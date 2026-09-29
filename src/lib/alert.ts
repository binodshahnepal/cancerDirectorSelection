export const showAlert = async (options: any) => {
  if (typeof window !== 'undefined') {
    const Swal = (await import('sweetalert2')).default;
    return Swal.fire(options);
  }
  return Promise.resolve({ isConfirmed: false, isDenied: false, isDismissed: true });
};
