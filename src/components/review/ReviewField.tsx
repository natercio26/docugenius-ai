
import React from 'react';

interface ReviewFieldProps {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}

const ReviewField: React.FC<ReviewFieldProps> = ({ label, value, icon }) => {
  if (!value) {
    value = "Não informado";
  }
  
  if (icon) {
    return (
      <div className="flex items-center gap-1.5">
        {icon}
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="font-medium">{value}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
};

export default ReviewField;
