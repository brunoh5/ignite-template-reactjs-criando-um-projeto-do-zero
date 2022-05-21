import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(
    [...postsPagination.results] || []
  );

  async function handleLoadPosts() {
    fetch(postsPagination.next_page)
      .then(res => res.json())
      .then(res => {
        const newPosts = res.results.map(result => {
          const post: Post = {
            first_publication_date: result.first_publication_date,
            uid: result.uid,
            data: {
              title: result.data.title,
              subtitle: result.data.subtitle,
              author: result.data.author,
            },
          };

          return post;
        });

        setPosts([...postsPagination.results, ...newPosts]);
      });
  }

  return (
    <>
      <Head>
        <title>Home | SpaceTraveling</title>
      </Head>
      <Header />
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <time>
                    <FiCalendar size={20} color="#FFF" />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </time>
                  <p>
                    <FiUser size={20} color="#FFF" />
                    {post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {postsPagination.next_page && (
          <button onClick={handleLoadPosts}>Carregar mais posts</button>
        )}
      </main>
    </>
  );
}

export const getStaticProps = async ({ req }) => {
  const prismic = getPrismicClient({ req });
  const postsResponse = await prismic.getByType('post', { pageSize: 1 });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
    },
  };
};
