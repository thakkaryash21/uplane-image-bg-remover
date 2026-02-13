export default function TransparencyBackground({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 opacity-25 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M0 0h10v10H0zM10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    />
  );
}
