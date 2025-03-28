
import React from 'react';
import { RegistrationData } from "@/types";
import PersonalDetailsSection from './PersonalDetailsSection';

interface SingleDetailsViewProps {
  registrationData: RegistrationData;
}

const SingleDetailsView: React.FC<SingleDetailsViewProps> = ({ 
  registrationData 
}) => {
  return (
    <PersonalDetailsSection registrationData={registrationData} />
  );
};

export default SingleDetailsView;
