'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { type Business } from '@/lib/types'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/lib/contexts/settings-context'

export function HeaderBusinessSelector() {
  const { businesses, selectedBusiness, selectBusiness } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  }, [userId]);

  const handleBusinessChange = (value: string) => {
    selectBusiness(value);
  };

  if (isLoading && pathname.startsWith('/dashboard')) {
    return <Skeleton className="h-10 w-48" />;
  }

  if (!userId && pathname.startsWith('/dashboard')) {
    return null;
  }

  if (businesses.length === 0 && !isLoading && pathname.startsWith('/dashboard')) {
    return (
      <Button variant="outline" asChild>
        <Link href="/dashboard/negocios/novo">Criar Negócio</Link>
      </Button>
    );
  }
  
  if (!pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      {isLoading ? (
        <Skeleton className="h-10 w-[200px]" />
      ) : businesses.length > 0 ? (
        <Select value={selectedBusiness?.id} onValueChange={handleBusinessChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione um negócio" />
          </SelectTrigger>
          <SelectContent>
            {businesses.map((business) => (
              <SelectItem key={business.id} value={business.id}>
                {business.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Button asChild>
          <Link href="/dashboard/negocios/novo">Criar Negócio</Link>
        </Button>
      )}
    </div>
  );
}
