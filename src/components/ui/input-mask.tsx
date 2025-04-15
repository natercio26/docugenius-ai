
import React, { useState } from "react";
import { Input } from "./input";

interface InputMaskProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask?: "date";
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ className, mask, onChange, ...props }, ref) => {
    const [value, setValue] = useState(props.defaultValue || props.value || "");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      
      if (mask === "date") {
        // Remove any non-digit characters
        newValue = newValue.replace(/\D/g, "");
        
        // Apply the date mask (DD/MM/YYYY)
        if (newValue.length <= 8) {
          if (newValue.length > 4) {
            newValue = `${newValue.slice(0, 2)}/${newValue.slice(2, 4)}/${newValue.slice(4)}`;
          } else if (newValue.length > 2) {
            newValue = `${newValue.slice(0, 2)}/${newValue.slice(2)}`;
          }
        } else {
          newValue = `${newValue.slice(0, 2)}/${newValue.slice(2, 4)}/${newValue.slice(4, 8)}`;
        }
      }
      
      setValue(newValue);
      
      if (onChange) {
        e.target.value = newValue;
        onChange(e);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={handleChange}
        className={className}
      />
    );
  }
);

InputMask.displayName = "InputMask";
