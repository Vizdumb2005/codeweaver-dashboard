export default {
  '{src,tests}/**/*.{ts,tsx,js,jsx}': (files) => {
    const tasks = [];
    tasks.push(`eslint --fix ${files.map(f => `"${f}"`).join(' ')}`);
    tasks.push(`prettier --check ${files.map(f => `"${f}"`).join(' ')}`);
    tasks.push(`vitest related --run --passWithNoTests ${files.map(f => `"${f}"`).join(' ')}`);
    return tasks;
  },
  '{src,tests}/**/*.{ts,tsx}': [
    () => 'tsc --noEmit'
  ]
};
