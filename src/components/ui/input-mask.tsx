import React, { useState } from "react";
import { Input } from "./input";

interface InputMaskProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask?: "date" | "cpf";
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ className, mask, onChange, ...props }, ref) => {
    const [value, setValue] = useState(props.defaultValue || props.value || "");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      
      if (mask === "date") {
        newValue = newValue.replace(/\D/g, "");
        
        if (newValue.length > 4) {
          if (newValue.length > 4) {
            newValue = `${newValue.slice(0, 2)}/${newValue.slice(2, 4)}/${newValue.slice(4)}`;
          } else if (newValue.length > 2) {
            newValue = `${newValue.slice(0, 2)}/${newValue.slice(2)}`;
          }
        } else {
          newValue = `${newValue.slice(0, 2)}/${newValue.slice(2, 4)}/${newValue.slice(4, 8)}`;
        }
      }
      
      if (mask === "cpf") {
        newValue = newValue.replace(/\D/g, '');
        
        if (newValue.length > 11) {
          newValue = newValue.slice(0, 11);
        }
        
        if (newValue.length === 11) {
          newValue = newValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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
