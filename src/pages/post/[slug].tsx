import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <span>Carregando...</span>;
  }

  const sumTotalWords = post.data.content.reduce((sumTotal, itemText) => {
    const totalWords = itemText.body.map(item => item.text.split(' ').length);

    totalWords.forEach(word => (sumTotal += word));
    return sumTotal;
  }, 0);

  const wordsReadPerMinute = 200;

  const readWordsByMinute = Math.ceil(sumTotalWords / wordsReadPerMinute);

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <Header />

      <article className={styles.container}>
        <img src={post.data.banner.url} alt="" />

        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <time>
              <FiCalendar size={20} color="#FFF" />
              {post.first_publication_date}
            </time>
            <p>
              <FiUser size={20} color="#FFF" />
              {post.data.author}
            </p>
            <p>
              <FiClock size={20} color="#FFF" />
              {readWordsByMinute} min
            </p>
          </div>
          <div className={styles.content}>
            {post.data.content.map(text => (
              <article key={text.heading}>
                <h1>{text.heading}</h1>
                {text.body.map(body => (
                  <p key={Math.floor(Math.random() * 846)}>{body.text}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  const prismic = getPrismicClient({});
  const allPosts = await prismic.getAllByType('post');

  const paths = allPosts.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByUID('post', String(params.slug), {});

  const first_publication_date = format(
    new Date(posts.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  Object.assign(posts, {
    ...posts,
    first_publication_date,
  });

  return {
    props: {
      post: posts,
    },
    revalidate: 60 * 60, // 1 Hour
  };
};
