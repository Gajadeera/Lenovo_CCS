// contexts/AllSocketProviders.jsx
import React from 'react';
import { SocketProvider } from './SocketContext';
import { DeviceSocketProvider } from './DeviceSocketContext';
import { JobSocketProvider } from './JobSocketContext';
import { PartsRequestSocketProvider } from './PartsSocketContext';
import { UserSocketProvider } from './UserSocketContext';
import { ReportSocketProvider } from './ReportSocketContext';
import { IssueSocketProvider } from './IssueSocketContext';
import { CustomerSocketProvider } from './CustomerSocketContext';
import { NotificationProvider } from './NotificationContext';

const ProviderComposer = ({ providers, children }) => {
    return providers.reduceRight((acc, Provider) => {
        return <Provider>{acc}</Provider>;
    }, children);
};

export const AllSocketProviders = ({ children }) => {
    return (
        <ProviderComposer
            providers={[
                SocketProvider,
                DeviceSocketProvider,
                JobSocketProvider,
                PartsRequestSocketProvider,
                UserSocketProvider,
                ReportSocketProvider,
                IssueSocketProvider,
                CustomerSocketProvider,
                NotificationProvider
            ]}
        >
            {children}
        </ProviderComposer>
    );
};