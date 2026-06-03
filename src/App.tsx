import React from 'react';

const App: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow-sm'>
        <div className='container mx-auto px-4 py-4'>
          <h1 className='text-2xl font-bold text-gray-900'>{__APP_NAME__}</h1>
          <p className='text-sm text-gray-500'>
            Environment: <span className='font-semibold'>{__ENV__}</span>
          </p>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Welcome to CodeWeaver Dashboard
          </h2>
          <p className='text-gray-600 mb-4'>Your Vite-powered Single Page Application is ready.</p>
          <p className='text-sm text-gray-500'>
            Version:
            {__APP_VERSION__}
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
