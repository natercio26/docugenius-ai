
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserRound, Users } from "lucide-react";

type RegistrationType = 'solteiro' | 'casado' | null;

const Cadastro: React.FC = () => {
  const [registrationType, setRegistrationType] = useState<RegistrationType>(null);
  const { toast } = useToast();

  const handleContinue = () => {
    if (!registrationType) {
      toast({
        title: "Seleção necessária",
        description: "Por favor, selecione um tipo de cadastro para continuar.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Cadastro iniciado",
      description: `Você selecionou o cadastro de ${registrationType}.`,
    });
    
    // Future implementation: navigate to specific form based on registration type
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Cadastro</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Selecione o tipo de cadastro</CardTitle>
          <CardDescription>
            Escolha o tipo de cadastro de acordo com seu estado civil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={registrationType || ''}
            onValueChange={(value) => setRegistrationType(value as RegistrationType)}
            className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6"
          >
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="solteiro" id="solteiro" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="solteiro" className="font-medium flex items-center gap-2">
                  <UserRound className="h-5 w-5" />
                  Solteiro(a)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Para pessoas solteiras, viúvas ou divorciadas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="casado" id="casado" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="casado" className="font-medium flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Casado(a)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Para pessoas casadas ou em união estável.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="w-full md:w-auto">
            Continuar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Cadastro;
