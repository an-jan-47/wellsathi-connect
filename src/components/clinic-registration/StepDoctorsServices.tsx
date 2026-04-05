import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, IndianRupee, ArrowLeft, UserPlus } from 'lucide-react';
import { doctorsServicesSchema, type DoctorsServicesData, SPECIALIZATIONS, SERVICES } from '@/types/clinic-registration';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface Props { data: Partial<DoctorsServicesData>; onNext: (data: DoctorsServicesData) => void; onBack: () => void; }

const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-[14px] font-medium outline-none transition-colors ${hasError ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-primary'}`;

function CustomSelect({ value, options, placeholder, onChange }: { value: string; options: string[]; placeholder: string; onChange: (v: string) => void; }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-2 border-slate-100 hover:border-primary/40 rounded-xl text-[14px] font-medium text-slate-700 transition-colors outline-none focus:border-primary">
          <span className={value ? 'text-slate-800' : 'text-slate-400'}>{value || placeholder}</span>
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="z-50 min-w-[220px] bg-white rounded-2xl shadow-xl border border-slate-100 p-2 max-h-[260px] overflow-y-auto" sideOffset={6}>
          {options.map(opt => (
            <DropdownMenu.Item key={opt} onSelect={() => onChange(opt)}
              className="px-3 py-2.5 text-[13px] font-medium text-slate-700 rounded-xl cursor-pointer hover:bg-primary/5 hover:text-primary outline-none data-[highlighted]:bg-primary/5 data-[highlighted]:text-primary">
              {opt}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function StepDoctorsServices({ data, onNext, onBack }: Props) {
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<DoctorsServicesData>({
    resolver: zodResolver(doctorsServicesSchema),
    defaultValues: {
      doctors: data.doctors?.length ? data.doctors : [{ name: '', specialization: '', fee: 0 }],
      services: data.services || [],
      defaultFee: data.defaultFee || 500,
    },
  });

  const { fields: doctorFields, append: addDoctor, remove: removeDoctor } = useFieldArray({ control, name: 'doctors' });
  const { fields: serviceFields, append: addService, remove: removeService } = useFieldArray({ control, name: 'services' });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-[26px] font-black text-slate-900">Doctors &amp; Services</h2>
        <p className="text-slate-400 font-medium mt-1 text-[14px]">Add your medical team and clinic services.</p>
      </div>

      {/* Default Fee */}
      <div>
        <label className="text-[13px] font-extrabold text-slate-700 mb-1.5 block">Default Consultation Fee (₹)</label>
        <div className="relative">
          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input id="defaultFee" type="number" min={0} placeholder="500"
            className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl text-[14px] font-medium outline-none transition-colors ${errors.defaultFee ? 'border-red-300' : 'border-slate-100 focus:border-primary'}`}
            {...register('defaultFee', { valueAsNumber: true })} />
        </div>
        {errors.defaultFee && <p className="text-[12px] text-red-500 font-medium mt-1">{errors.defaultFee.message}</p>}
      </div>

      {/* Doctors */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-extrabold text-slate-800">Doctors</p>
          <button type="button" onClick={() => addDoctor({ name: '', specialization: '', fee: 0 })}
            className="flex items-center gap-1.5 text-[12px] font-bold text-primary border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Doctor
          </button>
        </div>
        {errors.doctors?.message && <p className="text-[12px] text-red-500 font-medium mb-2">{errors.doctors.message}</p>}
        <div className="space-y-3">
          {doctorFields.map((field, i) => (
            <div key={field.id} className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-widest">Doctor {i + 1}</span>
                {doctorFields.length > 1 && (
                  <button type="button" onClick={() => removeDoctor(i)}
                    className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 mb-1 block uppercase tracking-wide">Name</label>
                  <input placeholder="Dr. Name" className={inputCls(!!errors.doctors?.[i]?.name)} {...register(`doctors.${i}.name`)} />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 mb-1 block uppercase tracking-wide">Specialization</label>
                  <CustomSelect
                    value={watch(`doctors.${i}.specialization`)}
                    options={SPECIALIZATIONS}
                    placeholder="Select…"
                    onChange={v => setValue(`doctors.${i}.specialization`, v)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 mb-1 block uppercase tracking-wide">Fee (₹)</label>
                  <input type="number" min={0} placeholder="Fee" className={inputCls()} {...register(`doctors.${i}.fee`, { valueAsNumber: true })} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-extrabold text-slate-800">Services <span className="font-medium text-slate-400">(Optional)</span></p>
          <button type="button" onClick={() => addService({ serviceName: '', fee: 0 })}
            className="flex items-center gap-1.5 text-[12px] font-bold text-primary border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Service
          </button>
        </div>
        {serviceFields.length > 0 && (
          <div className="space-y-3">
            {serviceFields.map((field, i) => (
              <div key={field.id} className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-extrabold text-slate-500 mb-1 block uppercase tracking-wide">Service</label>
                  <CustomSelect
                    value={watch(`services.${i}.serviceName`)}
                    options={SERVICES}
                    placeholder="Select service…"
                    onChange={v => setValue(`services.${i}.serviceName`, v)}
                  />
                </div>
                <div className="w-28 shrink-0">
                  <label className="text-[11px] font-extrabold text-slate-500 mb-1 block uppercase tracking-wide">Fee (₹)</label>
                  <input type="number" min={0} placeholder="₹" className={inputCls()} {...register(`services.${i}.fee`, { valueAsNumber: true })} />
                </div>
                <button type="button" onClick={() => removeService(i)}
                  className="w-8 h-8 mt-4 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0">
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
        {serviceFields.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
            <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-[13px] font-medium text-slate-400">No services added yet. Click "Add Service" above.</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-5 py-3.5 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors text-[14px]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button type="submit"
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/20 text-[15px]">
          Continue →
        </button>
      </div>
    </form>
  );
}
