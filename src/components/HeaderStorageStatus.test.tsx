import type { Session } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCloudCollectionSummary } from '../hooks/useCloudCollectionSummary';
import { useCollection } from '../hooks/useCollection';
import { HeaderStorageStatus } from './HeaderStorageStatus';

vi.mock('../hooks/useCollection',()=>({useCollection:vi.fn()}));
vi.mock('../hooks/useCloudCollectionSummary',()=>({useCloudCollectionSummary:vi.fn()}));

const session={user:{id:'user-1'}} as unknown as Session;

describe('HeaderStorageStatus',()=>{
  beforeEach(()=>{
    vi.mocked(useCollection).mockReturnValue({data:[]} as never);
    vi.mocked(useCloudCollectionSummary).mockReturnValue({data:undefined,isPending:false,isError:false} as never);
  });

  it('shows local storage alongside a disconnected cloud',()=>{
    render(<HeaderStorageStatus session={null} loading={false}/>);
    expect(screen.getByText('Saved locally')).toBeInTheDocument();
    expect(screen.getByText('Cloud disconnected')).toBeInTheDocument();
  });

  it('marks matching local and remote summaries as saved in cloud',()=>{
    vi.mocked(useCollection).mockReturnValue({data:[{speciesId:'species-25',quantity:2}]} as never);
    vi.mocked(useCloudCollectionSummary).mockReturnValue({data:{entries:1,species:1,totalQuantity:2},isPending:false,isError:false} as never);
    render(<HeaderStorageStatus session={session} loading={false}/>);
    expect(screen.getByText('Saved in cloud')).toBeInTheDocument();
  });

  it('keeps the empty cloud state isolated from the global empty layout class',()=>{
    vi.mocked(useCloudCollectionSummary).mockReturnValue({data:{entries:0,species:0,totalQuantity:0},isPending:false,isError:false} as never);
    render(<HeaderStorageStatus session={session} loading={false}/>);
    const indicator=screen.getByText('Cloud empty').closest('.storage-indicator');
    expect(indicator).toHaveClass('state-empty');
    expect(indicator).not.toHaveClass('empty');
  });

  it('warns when cloud and device summaries differ',()=>{
    vi.mocked(useCollection).mockReturnValue({data:[{speciesId:'species-25',quantity:2}]} as never);
    vi.mocked(useCloudCollectionSummary).mockReturnValue({data:{entries:1,species:1,totalQuantity:1},isPending:false,isError:false} as never);
    render(<HeaderStorageStatus session={session} loading={false}/>);
    expect(screen.getByText('Cloud differs from device')).toBeInTheDocument();
  });
});
