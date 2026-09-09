import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CloudAccountCard } from './CloudAccountCard';

vi.mock('../lib/supabase',()=>({isCloudConfigured:false,supabase:null}));

describe('CloudAccountCard',()=>{
  it('shows a disabled development preview when Supabase is not configured',()=>{
    const client=new QueryClient();
    render(<QueryClientProvider client={client}><MemoryRouter><CloudAccountCard/></MemoryRouter></QueryClientProvider>);
    expect(screen.getByRole('heading',{name:'Connect your collection'})).toBeInTheDocument();
    const googleButton=screen.getByRole('button',{name:'Continue with Google'});
    const discordButton=screen.getByRole('button',{name:'Continue with Discord'});
    expect(googleButton).toBeDisabled();
    expect(discordButton).toBeDisabled();
    expect(googleButton.querySelector('[data-brand-icon="google"]')).toBeInTheDocument();
    expect(discordButton.querySelector('[data-brand-icon="discord"]')).toBeInTheDocument();
    expect(screen.getByText('Configuration preview')).toBeInTheDocument();
  });
});
