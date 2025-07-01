'use client';

import { useEffect, useState } from 'react';
import {
  getServiceIntegrationStatus,
  generateEnvTemplate,
  type ServiceIntegrationStatus,
} from '~/lib/service-integrations';

export default function ServicesPage() {
  const [status, setStatus] = useState<ServiceIntegrationStatus | null>(null);
  const [envTemplate, setEnvTemplate] = useState<string>('');

  useEffect(() => {
    const serviceStatus = getServiceIntegrationStatus();
    setStatus(serviceStatus);
    setEnvTemplate(generateEnvTemplate());
  }, []);

  if (!status) {
    return <div className="p-8">Loading service status...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Service Integrations</h1>
        <p className="text-gray-600">
          Monitor and configure external service integrations for Civilyst
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {status.summary.configured}
          </div>
          <div className="text-sm text-blue-600">Configured Services</div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600">
            {status.summary.total}
          </div>
          <div className="text-sm text-gray-600">Total Services</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {status.summary.requiredConfigured}
          </div>
          <div className="text-sm text-green-600">Required Configured</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {status.summary.required}
          </div>
          <div className="text-sm text-yellow-600">Required Total</div>
        </div>
      </div>

      {/* Overall Status */}
      <div
        className={`p-4 rounded-lg border ${
          status.allRequired
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              status.allRequired ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className="font-semibold">
            {status.allRequired
              ? 'All required services are configured'
              : 'Some services need configuration'}
          </span>
        </div>
      </div>

      {/* Service Details */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Service Details</h2>

        <div className="grid gap-4">
          {status.services.map((service) => (
            <div
              key={service.name}
              className={`p-4 rounded-lg border ${
                service.configured
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        service.configured ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                    <h3 className="font-semibold">{service.name}</h3>
                    {service.required && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                        REQUIRED
                      </span>
                    )}
                  </div>

                  {service.fallback && !service.configured && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Fallback:</strong> {service.fallback}
                    </p>
                  )}

                  {service.setupInstructions && !service.configured && (
                    <p className="text-sm text-gray-700">
                      <strong>Setup:</strong> {service.setupInstructions}
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-500">
                  {service.configured ? '✅ Configured' : '⚠️ Not configured'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Template */}
      {envTemplate !== '# All services are configured! 🎉' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Environment Configuration</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-4">
              Add these environment variables to your <code>.env.local</code>{' '}
              file:
            </p>
            <pre className="text-sm bg-white border rounded p-4 overflow-x-auto">
              {envTemplate}
            </pre>
          </div>
        </div>
      )}

      {/* API Health Check */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">API Health Check</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">
            Check the real-time health status at:
          </p>
          <code className="text-sm bg-white border rounded px-2 py-1">
            GET /api/health/integrations
          </code>
        </div>
      </div>
    </div>
  );
}
