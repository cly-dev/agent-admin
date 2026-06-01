export default (initialState: { name?: string } | undefined) => {
  const canSeeAdmin = !!(initialState && initialState.name !== 'dontHaveAccess');
  return {
    canSeeAdmin,
  };
};
