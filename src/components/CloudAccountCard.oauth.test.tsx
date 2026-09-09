import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudAccountCard } from './CloudAccountCard';

const mocks=vi.hoisted(()=>({signInWithOAuth:vi.fn().mockResolvedValue({error:null})}));

vi.mock('../hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({session:null,loading:false})}));
vi.mock('../lib/supabase',()=>({
  isCloudConfigured:true,
  supabase:{auth:{signInWithOAuth:mocks.signInWithOAuth,signInWithOtp:vi.fn(),signOut:vi.fn()}},
}));

afterEach(()=>{cleanup();mocks.signInWithOAuth.mockClear()});

describe('CloudAccountCard OAuth',()=>{
  it('always asks Google to show the account chooser',async()=>{
    const client=new QueryClient();
    render(<QueryClientProvider client={client}><MemoryRouter><CloudAccountCard/></MemoryRouter></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button',{name:'Continue with Google'}));
    await waitFor(()=>expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider:'google',
      options:{redirectTo:`${window.location.origin}/backup`,queryParams:{prompt:'select_account'}},
    }));
  });

  it('always asks Discord to show the authorization screen',async()=>{
    const client=new QueryClient();
    render(<QueryClientProvider client={client}><MemoryRouter><CloudAccountCard/></MemoryRouter></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button',{name:'Continue with Discord'}));
    await waitFor(()=>expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider:'discord',
      options:{redirectTo:`${window.location.origin}/backup`,queryParams:{prompt:'consent'}},
    }));
  });
});
