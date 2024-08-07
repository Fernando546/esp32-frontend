import React from 'react';

const Loading = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
      <div className="loader">Loading...</div>
      <style jsx>{`
        .loader {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-left-color: #fff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;
