import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, UserPlus, IndianRupee } from 'lucide-react';
import { doctorsServicesSchema, type DoctorsServicesData, SPECIALIZATIONS, SERVICES } from '@/types/clinic-registration';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StepDoctorsServicesProps {
  data: Partial<DoctorsServicesData>;
  onNext: (data: DoctorsServicesData) => void;
  onBack: () => void;
}

export function StepDoctorsServices({ data, onNext, onBack }: StepDoctorsServicesProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DoctorsServicesData>({
    resolver: zodResolver(doctorsServicesSchema),
    defaultValues: {
      doctors: data.doctors?.length ? data.doctors : [{ name: '', specialization: '', fee: 0 }],
      services: data.services || [],
      defaultFee: data.defaultFee || 500,
    },
  });

  const { fields: doctorFields, append: appendDoctor, remove: removeDoctor } = useFieldArray({
    control,
    name: 'doctors',
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control,
    name: 'services',
  });

  const onSubmit = (formData: DoctorsServicesData) => {
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Doctors & Services</h2>
        <p className="text-muted-foreground mt-2">
          Add your team and services
        </p>
      </div>

      {/* Default Fee */}
      <div className="space-y-2">
        <Label htmlFor="defaultFee">Default Consultation Fee (₹)</Label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="defaultFee"
            type="number"
            min={0}
            placeholder="500"
            className={cn('pl-10', errors.defaultFee && 'border-destructive')}
            {...register('defaultFee', { valueAsNumber: true })}
          />
        </div>
        {errors.defaultFee && (
          <p className="text-sm text-destructive">{errors.defaultFee.message}</p>
        )}
      </div>

      {/* Doctors Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Doctors</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendDoctor({ name: '', specialization: '', fee: 0 })}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Doctor
          </Button>
        </div>

        {errors.doctors?.message && (
          <p className="text-sm text-destructive">{errors.doctors.message}</p>
        )}

        <div className="space-y-3">
          {doctorFields.map((field, index) => (
            <Card key={field.id} className="bg-muted/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Doctor {index + 1}
                  </span>
                  {doctorFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeDoctor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="Dr. Name"
                      className={cn(errors.doctors?.[index]?.name && 'border-destructive')}
                      {...register(`doctors.${index}.name`)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Specialization</Label>
                    <Select
                      defaultValue={watch(`doctors.${index}.specialization`)}
                      onValueChange={(value) => setValue(`doctors.${index}.specialization`, value)}
                    >
                      <SelectTrigger className={cn(errors.doctors?.[index]?.specialization && 'border-destructive')}>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALIZATIONS.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Fee (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Fee"
                      {...register(`doctors.${index}.fee`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Services Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Services (Optional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendService({ serviceName: '', fee: 0 })}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Service
          </Button>
        </div>

        {serviceFields.length > 0 && (
          <div className="space-y-3">
            {serviceFields.map((field, index) => (
              <Card key={field.id} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Select
                        defaultValue={watch(`services.${index}.serviceName`)}
                        onValueChange={(value) => setValue(`services.${index}.serviceName`, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service..." />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICES.map((service) => (
                            <SelectItem key={service} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-28">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Fee ₹"
                        {...register(`services.${index}.fee`, { valueAsNumber: true })}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeService(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue
        </Button>
      </div>
    </form>
  );
}
