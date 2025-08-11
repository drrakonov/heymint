// Loader.jsx
const Loader = ({ size = 40, color = "#4F46E5" }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${size / 8}px solid #e5e7eb`, // Tailwind gray-200 equivalent
        borderTop: `${size / 8}px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
  );
};

export default Loader;

// CSS (global.css or in index.css)

