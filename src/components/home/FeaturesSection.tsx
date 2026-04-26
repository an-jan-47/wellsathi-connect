import { CheckCircle2, Zap, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: CheckCircle2,
    title: 'Verified Clinics',
    description: 'We carefully vet every clinic to ensure you receive the highest standard of care.',
  },
  {
    icon: Zap,
    title: 'Instant Booking',
    description: 'Skip the waiting times. Book your appointment instantly with real-time availability.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Records',
    description: 'Your health data is encrypted and stored securely, accessible only by you and your doctor.',
  },
];

export function FeaturesSection() {
  return (
    <section id="why-wellsathi" className="py-24 bg-white">
      <div className="container max-w-[1000px]">
        <div className="text-center mb-16 animate-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            Why Choose WellSathi?
          </h2>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Experience healthcare booking designed for your peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className="flex flex-col items-center group animate-in slide-in-from-bottom-8 duration-700 fill-mode-both"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Floating animated icon container */}
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:-translate-y-2 group-hover:shadow-primary/50 transition-all duration-300 ease-out">
                <feature.icon className="h-8 w-8 stroke-[2.5]" />
              </div>
              <h3 className="text-[19px] font-extrabold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-[14px] text-slate-500 font-medium leading-relaxed max-w-[280px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
