-- Storage Bucket Policies for 'images' bucket
-- Run this in Supabase SQL Editor AFTER creating the 'images' bucket in Storage UI

-- Allow anyone to read images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'images' );

-- Allow authenticated admins to insert images
create policy "Admin can upload images"
on storage.objects for insert
with check (
  bucket_id = 'images' 
  AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Allow authenticated admins to update images
create policy "Admin can update images"
on storage.objects for update
using (
  bucket_id = 'images'
  AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Allow authenticated admins to delete images
create policy "Admin can delete images"
on storage.objects for delete
using (
  bucket_id = 'images'
  AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);
