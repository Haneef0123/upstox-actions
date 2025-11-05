'use client';

import { useEffect, useState } from 'react';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'checking';
  endpoint: string;
  icon: string;
}

export function StatusCards() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'PR Review API',
      status: 'checking',
      endpoint: '/api/prreview',
      icon: '🤖',
    },
    {
      name: 'PR Description API',
      status: 'checking',
      endpoint: '/api/prdescription',
      icon: '📝',
    },
    {
      name: 'Cron Job API',
      status: 'checking',
      endpoint: '/api/cron',
      icon: '⏰',
    },
  ]);

  useEffect(() => {
    const checkStatus = async () => {
      const updatedServices = await Promise.all(
        services.map(async (service) => {
          try {
            const response = await fetch(service.endpoint, {
              method: 'GET',
            });

            return {
              ...service,
              status: response.ok ? ('online' as const) : ('offline' as const),
            };
          } catch (error) {
            return {
              ...service,
              status: 'offline' as const,
            };
          }
        })
      );

      setServices(updatedServices);
    };

    checkStatus();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {services.map((service) => (
        <div
          key={service.name}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-2xl dark:bg-slate-800">
                {service.icon}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                  {service.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {service.endpoint}
                </p>
              </div>
            </div>
            <div>
              {service.status === 'checking' && (
                <div className="flex h-3 w-3 items-center justify-center">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-yellow-500"></div>
                </div>
              )}
              {service.status === 'online' && (
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Online
                  </span>
                </div>
              )}
              {service.status === 'offline' && (
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    Offline
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
