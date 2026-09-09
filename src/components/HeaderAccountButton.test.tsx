import type { Session } from '@supabase/supabase-js';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { HeaderAccountButton } from './HeaderAccountButton';

afterEach(cleanup);

describe('HeaderAccountButton',()=>{
  it('links signed-out users to the account area',()=>{
    render(<MemoryRouter><HeaderAccountButton session={null} loading={false}/></MemoryRouter>);
    expect(screen.getByRole('link',{name:/Sign in/})).toHaveAttribute('href','/backup');
  });

  it('shows the connected user identity',()=>{
    const session={user:{email:'ash@example.com',app_metadata:{provider:'google'},user_metadata:{name:'Ash',avatar_url:'https://lh3.googleusercontent.com/ash.png'}}} as unknown as Session;
    render(<MemoryRouter><HeaderAccountButton session={session} loading={false}/></MemoryRouter>);
    const account=screen.getByRole('link',{name:'My account: Ash'});
    expect(account).toHaveAttribute('href','/backup');
    expect(account.querySelector('img')).toHaveAttribute('src','https://lh3.googleusercontent.com/ash.png');
    expect(account.querySelector('[data-auth-provider="google"]')).toBeInTheDocument();
    expect(screen.queryByText('ash@example.com')).not.toBeInTheDocument();
  });

  it.each(['discord','email'] as const)('shows the %s authentication provider',provider=>{
    const session={user:{email:'misty@example.com',app_metadata:{provider},user_metadata:{name:'Misty'}}} as unknown as Session;
    render(<MemoryRouter><HeaderAccountButton session={session} loading={false}/></MemoryRouter>);
    const account=screen.getByRole('link',{name:'My account: Misty'});
    expect(account.querySelector(`[data-auth-provider="${provider}"]`)).toBeInTheDocument();
  });


  it('prefers the Discord profile display name over the username',()=>{
    const session={user:{app_metadata:{provider:'discord'},user_metadata:{global_name:'Misty Waterflower',full_name:'misty_user',name:'misty_user#0'}}} as unknown as Session;
    render(<MemoryRouter><HeaderAccountButton session={session} loading={false}/></MemoryRouter>);
    expect(screen.getByRole('link',{name:'My account: Misty Waterflower'})).toBeInTheDocument();
    expect(screen.queryByText('misty_user')).not.toBeInTheDocument();
  });

  it('falls back to the Discord username when no profile display name is set',()=>{
    const session={user:{app_metadata:{provider:'discord'},user_metadata:{global_name:null,full_name:'misty_user',name:'misty_user#0'}}} as unknown as Session;
    render(<MemoryRouter><HeaderAccountButton session={session} loading={false}/></MemoryRouter>);
    expect(screen.getByRole('link',{name:'My account: misty_user'})).toBeInTheDocument();
  });

  it('does not use an email address as the visible name',()=>{
    const session={user:{email:'brock@example.com',app_metadata:{provider:'email'},user_metadata:{}}} as unknown as Session;
    render(<MemoryRouter><HeaderAccountButton session={session} loading={false}/></MemoryRouter>);
    expect(screen.getByText('My account')).toBeInTheDocument();
    expect(screen.queryByText('brock@example.com')).not.toBeInTheDocument();
  });

  it('does not load an avatar from an untrusted metadata host',()=>{
    const session={user:{app_metadata:{provider:'google'},user_metadata:{name:'Gary',avatar_url:'https://tracker.example/avatar.png'}}} as unknown as Session;
    render(<MemoryRouter><HeaderAccountButton session={session} loading={false}/></MemoryRouter>);
    expect(screen.getByRole('link',{name:'My account: Gary'}).querySelector('img')).not.toBeInTheDocument();
  });
});
